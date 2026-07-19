"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { pdf } from '@react-pdf/renderer';
import { fileSave } from 'browser-fs-access';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { PDFDocument } from 'pdf-lib';
import editorStore from '@/store/editor';
import icon from '@/assets/icon.svg';
import { academicTerms, getDepartment, getSessionalCourses, getUniversity, SessionalCourse, universities } from '@/data/report-presets';
import { CoverTemplate } from './cover-template';
import { LabReport, ReportDocument, ReportSection } from './report-pdf';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

type Section = ReportSection;
type Report = LabReport;

const REPORT_DRAFT_STORAGE_KEY = "ruet-report-draft-v2";

const makeSection = (id: string, title: string, placeholder: string, kind?: Section["kind"]): Section => ({
  id,
  title,
  body: "",
  placeholder,
  kind,
});

const presets: Record<string, { label: string; sections: Section[] }> = {
  assembly: { label: "CSE 2206 / Assembly", sections: [
    makeSection("objective", "Objective", "State the purpose of the experiment clearly."),
    makeSection("theory", "Theory", "Explain the 8086 instructions, registers, interrupts, ASCII values, or concepts used in the experiment."),
    makeSection("code", "Assembly Language Code", "; Paste the complete, executable assembly program here", "code"),
    makeSection("output", "Output", "Upload the emulator or console screenshot using Add image. Add a short note only when needed."),
    makeSection("verdict", "Verdict", "State whether the program assembled and executed successfully and whether the expected result was obtained."),
    makeSection("discussion", "Discussion", "Explain the register values, program flow, instructions, and observed output."),
    makeSection("conclusion", "Conclusion", "Summarize the 8086 concepts and practical skills demonstrated by the experiment."),
  ] },
  programming: { label: "Programming / Logic", sections: [
    ["objective","Objective","Describe what the problem or exercise verifies."],
    ["theory","Theory","Explain the relevant ideas, definitions, formulae, or logical rules."],
    ["algorithm","Algorithm","1. List inputs and assumptions.\n2. Describe the steps.\n3. Compute or evaluate the result.\n4. Display the output."],
    ["code","Code","# Paste clean, runnable code here","code"],
    ["output","Sample Output","Paste the output or add an observation."],
    ["discussion","Discussion","Interpret the output and explain any noteworthy cases."],
    ["conclusion","Conclusion","Summarize what was verified and learned."],
  ].map(([id,title,placeholder,kind])=>makeSection(id,title,placeholder,kind as Section["kind"])) },
  electrical: { label: "Electrical / Instrumentation", sections: [
    ["objectives","Objectives","1. State the primary objective.\n2. Add any comparison or verification objective."],
    ["theory","Theory","Explain the operating principle, relationships, and relevant formulae."],
    ["apparatus","Required Apparatus","1. List equipment\n2. Include ratings or quantities where useful"],
    ["diagram","Circuit Diagram","Insert the circuit diagram using the image button, then add a figure caption."],
    ["procedure","Procedure","1. Describe connections and safety checks.\n2. Explain how readings were taken.\n3. State how results were calculated."],
    ["data","Data Table and Calculations","Add measured values, units, equations, sample calculations, and percentage error."],
    ["result","Result and Discussion","Compare experimental and theoretical values. Discuss errors, losses, and instrument limitations."],
    ["conclusion","Conclusion","State whether the experiment verified the expected behaviour."],
  ].map(([id,title,placeholder])=>makeSection(id,title,placeholder)) },
  experimental: { label: "Experimental Science", sections: [
    ["objective","Objective","State the purpose of the experiment clearly."],
    ["theory","Theory","Explain the scientific principle, relationships, and relevant formulae."],
    ["apparatus","Required Apparatus","List the equipment, materials, and quantities used."],
    ["procedure","Procedure","Describe the experimental steps in the order performed, including necessary safety precautions."],
    ["data","Observations and Calculations","Record observations with units, equations, sample calculations, and uncertainty where relevant."],
    ["result","Result","State the result obtained without inventing measurements that were not observed."],
    ["discussion","Discussion","Interpret the result and discuss errors, limitations, and comparison with expected behaviour."],
    ["conclusion","Conclusion","Summarize what the experiment demonstrated."],
  ].map(([id,title,placeholder])=>makeSection(id,title,placeholder)) },
  general: { label: "General Sessional", sections: [
    ["objective","Objective","State the purpose and expected learning outcome."],
    ["introduction","Introduction or Theory","Explain the relevant concepts and background."],
    ["method","Method or Activity","Describe the work completed in a clear sequence."],
    ["output","Output or Deliverable","Add the produced work, result, presentation summary, or observation."],
    ["discussion","Discussion","Explain the outcome, important decisions, limitations, and lessons learned."],
    ["conclusion","Conclusion","Summarize the completed work and learning outcome."],
  ].map(([id,title,placeholder])=>makeSection(id,title,placeholder)) },
};

const initial: Report = {
  preset:"assembly", university:"ruet", presetDepartment:"CSE", semester:"2-2", sessionalCourse:"CSE 2206",
  department:"Computer Science & Engineering", courseCode:"CSE 2206",
  courseTitle:"Microprocessors, Microcontrollers and Assembly Language Sessional", labNo:"01",
  labTitle:"Allocation of Memory Values with 8-bit Registers", experimentDate:"", submissionDate:"",
  studentName:"Md. Tusar Imran", roll:"2303096", section:"B", series:"23",
  teacherName:"Md. Sozib Hossain", teacherTitle:"Assistant Professor",
  sections: presets.assembly.sections,
};

const legacyAssemblyPrompts = new Set([
  "State the purpose of the experiment clearly. Use bullet points for multiple objectives.",
  "Explain the instructions, registers, addressing modes, or concepts needed to understand the work.",
  "; Paste complete, executable and commented code here",
  "Add result screenshots below and describe important register, flag, memory, or output values.",
  "State the final result and whether it matches the expected output.",
  "Discuss how the program works, errors corrected, limitations, and possible improvements.",
  "Summarize the concepts and practical skills learned from the experiment.",
]);

const defaultSectionPrompts = new Set([
  ...legacyAssemblyPrompts,
  ...Object.values(presets).flatMap(preset => preset.sections.map(section => section.placeholder).filter(Boolean)),
]);

const normalizeDraft = (draft: Report): Report => {
  const normalized = {
    ...draft,
    university: draft.university || "ruet",
    presetDepartment: draft.presetDepartment || "CSE",
    semester: draft.semester || "2-2",
    sessionalCourse: draft.sessionalCourse || (draft.preset === "assembly" ? "CSE 2206" : ""),
  };
  const templateSections = presets[normalized.preset]?.sections;
  if (!templateSections) return normalized;
  const existing = new Map(normalized.sections.map(section => [section.id, section]));
  return {
    ...normalized,
    sections: templateSections.map(template => {
      const saved = existing.get(template.id) ?? (template.id === "verdict" ? existing.get("result") : undefined);
      const body = saved?.body && !defaultSectionPrompts.has(saved.body) ? saved.body : "";
      return { ...template, body };
    }),
  };
};

export default function Home() {
  const [report,setReport] = useState<Report>(()=>{if(typeof window==="undefined")return initial;const raw=localStorage.getItem(REPORT_DRAFT_STORAGE_KEY);if(!raw)return initial;try{return normalizeDraft(JSON.parse(raw))}catch{return initial}});
  const [saved,setSaved] = useState("Draft saved locally");
  const [downloading,setDownloading] = useState(false);
  const [generating,setGenerating] = useState(false);
  const [aiNotes,setAiNotes] = useState("");
  const [aiMessage,setAiMessage] = useState("");
  const fileRef=useRef<HTMLInputElement>(null);
  const department=useAtomValue(editorStore.studentDepartment);
  const courseCode=useAtomValue(editorStore.courseNo);
  const courseTitle=useAtomValue(editorStore.courseTitle);
  const labNo=useAtomValue(editorStore.coverNo);
  const labTitle=useAtomValue(editorStore.coverTitle);
  const experimentDate=useAtomValue(editorStore.dateOfExperiment);
  const submissionDate=useAtomValue(editorStore.dateOfSubmission);
  const studentName=useAtomValue(editorStore.studentName);
  const roll=useAtomValue(editorStore.studentID);
  const section=useAtomValue(editorStore.studentSection);
  const teacherName=useAtomValue(editorStore.teacherName);
  const teacherTitle=useAtomValue(editorStore.teacherDesignation);
  const selectedUniversity=useMemo(()=>getUniversity(report.university),[report.university]);
  const selectedDepartment=useMemo(()=>getDepartment(report.university,report.presetDepartment),[report.university,report.presetDepartment]);
  const sessionalCourses=useMemo(()=>getSessionalCourses(report.university,report.presetDepartment,report.semester),[report.university,report.presetDepartment,report.semester]);
  const selectedCourse=useMemo(()=>sessionalCourses.find(course=>course.code===report.sessionalCourse)??sessionalCourses[0],[sessionalCourses,report.sessionalCourse]);
  const reportForExport=useMemo<Report>(()=>({...report,department,courseCode,courseTitle,labNo,labTitle,experimentDate:experimentDate?dayjs(experimentDate).format('YYYY-MM-DD'):'',submissionDate:submissionDate?dayjs(submissionDate).format('YYYY-MM-DD'):'',studentName,roll,section,series:roll.slice(0,2),teacherName,teacherTitle}),[report,department,courseCode,courseTitle,labNo,labTitle,experimentDate,submissionDate,studentName,roll,section,teacherName,teacherTitle]);
  useEffect(()=>{ const t=setTimeout(()=>{localStorage.setItem(REPORT_DRAFT_STORAGE_KEY,JSON.stringify(report));setSaved("Saved just now");},350); return()=>clearTimeout(t);},[report]);
  const complete=useMemo(()=>Math.round((report.sections.filter(s=>s.body.trim()).length/report.sections.length)*100),[report.sections]);
  const applyCourse=(r:Report,selected?:SessionalCourse):Report=>{
    if(!selected)return {...r,sessionalCourse:""};
    return {...r,sessionalCourse:selected.code,preset:selected.format,sections:presets[selected.format].sections.map(s=>({...s}))};
  };
  const changeCourse=(code:string)=>setReport(r=>applyCourse(r,getSessionalCourses(r.university,r.presetDepartment,r.semester).find(course=>course.code===code)));
  const changeUniversity=(id:string)=>setReport(r=>{
    const university=getUniversity(id);
    const next={...r,university:university.id,presetDepartment:university.departments[0].code};
    return applyCourse(next,getSessionalCourses(next.university,next.presetDepartment,next.semester)[0]);
  });
  const changeDepartment=(code:string)=>setReport(r=>{
    const next={...r,presetDepartment:code};
    return applyCourse(next,getSessionalCourses(next.university,next.presetDepartment,next.semester)[0]);
  });
  const changeSemester=(semester:string)=>setReport(r=>{
    const next={...r,semester};
    return applyCourse(next,getSessionalCourses(next.university,next.presetDepartment,next.semester)[0]);
  });
  const updateSection=(id:string,body:string)=>setReport(r=>({...r,sections:r.sections.map(s=>s.id===id?{...s,body}:s)}));
  const addImage=(id:string,e:ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;const reader=new FileReader();reader.onload=()=>updateSection(id,`${report.sections.find(s=>s.id===id)?.body||""}\n\n[IMAGE:${reader.result}]`);reader.readAsDataURL(f)};
  const fillWithAI=async()=>{
    if(!selectedCourse){setAiMessage("No verified sessional course data is available for this RUET department yet.");return;}
    if(!reportForExport.labTitle.trim()){setAiMessage("Add the Lab Title on the Cover Page first, then try again.");return;}
    setGenerating(true);setAiMessage("");
    try{
      const response=await fetch("/api/generate-report",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({courseCode:reportForExport.courseCode,courseTitle:reportForExport.courseTitle,labNo:reportForExport.labNo,labTitle:reportForExport.labTitle,preset:report.preset,sessionalCourse:`${selectedCourse.code} — ${selectedCourse.title}`,university:selectedUniversity.name,universityStatus:selectedUniversity.verified?"verified RUET curriculum":"demo structure",presetDepartment:`${selectedDepartment.code} — ${selectedDepartment.name}`,semester:report.semester,notes:aiNotes,sections:report.sections.map(({id,title,body,kind})=>({id,title,kind,body:body.replace(/\[IMAGE:data:image\/[^\]]+\]/g,"[uploaded output image]")}))})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Could not generate the report.");
      let filled=0;
      setReport(current=>({...current,sections:current.sections.map(section=>{
        if(section.body.trim())return section;
        const generated=typeof data.sections?.[section.id]==="string"?data.sections[section.id].trim():"";
        if(!generated)return section;
        filled+=1;
        return {...section,body:generated};
      })}));
      setAiMessage(filled?`AI filled ${filled} empty section${filled===1?"":"s"}. Review the content before downloading.`:"There were no empty sections to fill.");
    }catch(error){setAiMessage(error instanceof Error?error.message:"Could not generate the report.");}
    finally{setGenerating(false)}
  };
  const exportWord=()=>{const body=document.querySelector(".paper")?.innerHTML||"";const html=`<html><head><meta charset="utf-8"><style>@page{margin:1in}body{font-family:'Times New Roman';font-size:12pt;line-height:1.5}h1{font-size:15pt;margin:0 0 22pt}h2{font-size:14pt;margin:0 0 5pt}.report-section{margin:0 0 14pt}p{text-align:justify;white-space:pre-wrap}pre{font-family:'Courier New';font-size:11pt;line-height:1.3;border:1px solid #222;padding:10pt;white-space:pre-wrap}img{display:block;max-width:100%;margin:8pt auto}</style></head><body>${body}</body></html>`;const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([html],{type:"application/msword"}));a.download=`${reportForExport.courseCode}-Lab-${reportForExport.labNo}.doc`;a.click();};
  const backup=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(reportForExport,null,2)],{type:"application/json"}));a.download="ruet-lab-report.json";a.click()};
  const importDraft=(e:ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{setReport(normalizeDraft(JSON.parse(String(rd.result))));}catch{alert("That file is not a valid report backup.")}};rd.readAsText(f)};
  const downloadCompleteReport=async()=>{setDownloading(true);try{const [coverBlob,reportBlob]=await Promise.all([pdf(<CoverTemplate/>).toBlob(),pdf(<ReportDocument report={reportForExport}/>).toBlob()]);const merged=await PDFDocument.create();for(const blob of [coverBlob,reportBlob]){const source=await PDFDocument.load(await blob.arrayBuffer());const pages=await merged.copyPages(source,source.getPageIndices());pages.forEach(page=>merged.addPage(page));}const bytes=await merged.save();await fileSave(new Blob([bytes],{type:"application/pdf"}),{fileName:`${reportForExport.courseCode || "RUET"}-Lab-${reportForExport.labNo || "Report"}.pdf`,extensions:[".pdf"]});}catch(error){console.error(error);alert("Could not create the complete report PDF.");}finally{setDownloading(false)}};
  return <main className="report-studio">
    <header className="report-toolbar">
      <div className="report-title"><img src={icon} alt=""/><h1>Lab Report <span>Builder</span></h1></div>
      <div className="report-actions"><span className="saved"><i/> {saved}</span><Button variant="outline" size="sm" className="quiet" onClick={backup}>Backup</Button><Button variant="outline" size="sm" className="quiet" onClick={()=>fileRef.current?.click()}>Import</Button><input ref={fileRef} hidden type="file" accept="application/json" onChange={importDraft}/><Button variant="outline" size="sm" className="quiet" onClick={exportWord}>Word</Button><Button size="sm" disabled={downloading} onClick={downloadCompleteReport}>{downloading?"Preparing…":"Download Complete Report"}</Button></div>
    </header>
    <section className="report-workspace">
      <aside className="report-editor">
        <div className="report-editor-heading"><div><h2>Report Content</h2><p>Cover details are used automatically.</p></div><span className="progress">{complete}% ready</span></div>
        <div className="report-panel">
          <div className="preset-card">
            <div className="preset-card-heading"><div><strong>Report preset</strong><span>Choose the academic context used by the AI assistant.</span></div><span className={`source-badge ${selectedUniversity.verified?"verified":"demo"}`}>{selectedUniversity.verified?"Verified":"Demo"}</span></div>
            <div className="preset-grid">
              <label className="preset-field"><span>University</span><select className="report-select" value={report.university} onChange={e=>changeUniversity(e.target.value)}>{universities.map(university=><option key={university.id} value={university.id}>{university.shortName}{university.verified?" — Verified":" — Demo"}</option>)}</select></label>
              <label className="preset-field"><span>Department</span><select className="report-select" value={report.presetDepartment} onChange={e=>changeDepartment(e.target.value)}>{selectedUniversity.departments.map(department=><option key={department.code} value={department.code}>{department.code} — {department.name}</option>)}</select></label>
              <label className="preset-field"><span>Semester</span><select className="report-select" value={report.semester} onChange={e=>changeSemester(e.target.value)}>{academicTerms.map(term=><option key={term} value={term}>{term}</option>)}</select></label>
              <label className="preset-field course-field"><span>Sessional course</span><select className="report-select" value={selectedCourse?.code??""} disabled={!sessionalCourses.length} onChange={e=>changeCourse(e.target.value)}>{sessionalCourses.length?sessionalCourses.map(course=><option key={course.code} value={course.code}>{course.code} — {course.title}{selectedUniversity.verified?"":" — Demo"}</option>):<option value="">Verified course data not available yet</option>}</select></label>
            </div>
            <div className="preset-source">{selectedUniversity.verified&&selectedDepartment.code==="CSE"?<><span>Sessional courses verified from your RUET CSE OBE Curriculum and Syllabus; department identity checked against the</span> <a href="https://www.ruet.ac.bd/faculty" target="_blank" rel="noreferrer">official RUET faculty directory</a>.</>:selectedUniversity.verified?<>This department is official, but its semester-by-semester curriculum source has not been added yet.</>:<>Sessional courses for {selectedUniversity.shortName} are demo data for now.</>}</div>
          </div>
          <div className="report-note">The selected sessional course loads an appropriate report structure and guides AI generation. Cover-page details are still kept out of the lab-report pages.</div>
          <div className="ai-fill-card">
            <div className="ai-fill-heading"><div><strong>AI report assistant</strong><span>Uses the cover details and anything already written.</span></div><span className="ai-badge">AI</span></div>
            <Textarea rows={4} value={aiNotes} onChange={e=>setAiNotes(e.target.value)} placeholder="Optional: paste the lab task, input values, expected output, observed register values, or any teacher instructions."/>
            <div className="ai-fill-actions"><span>{aiMessage||"Existing content will not be overwritten."}</span><Button type="button" size="sm" disabled={generating||!selectedCourse} onClick={fillWithAI}>{generating?"Generating…":"Fill empty sections with AI"}</Button></div>
          </div>
          {report.sections.map((s,i)=><div className="section-edit" key={s.id}><div className="section-label"><div><span>{String(i+1).padStart(2,"0")}</span><strong>{s.title}</strong></div><label className="image-add">Add image<input hidden type="file" accept="image/*" onChange={e=>addImage(s.id,e)}/></label></div><Textarea className={s.kind==="code"?"code-input":""} rows={s.kind==="code"?12:5} placeholder={s.placeholder} value={s.body} onChange={e=>updateSection(s.id,e.target.value)}/></div>)}
        </div>
      </aside>
      <section className="report-preview-column"><div className="report-preview-toolbar"><strong>Lab Report Preview</strong><span>Times New Roman · 12 pt</span></div><div className="preview-wrap"><article className="paper report-paper">
        <section className="report-body"><h1>Lab No. {reportForExport.labNo}: {reportForExport.labTitle}</h1>{report.sections.map(s=><section className="report-section" key={s.id}><h2>{s.title}</h2>{s.body.split(/(\[IMAGE:data:image\/[^\]]+\])/).map((part,i)=>part.startsWith("[IMAGE:")?/* eslint-disable-next-line @next/next/no-img-element */<img key={i} src={part.slice(7,-1)} alt="Report figure"/>:s.kind==="code"?<pre key={i}>{part}</pre>:<p key={i}>{part}</p>)}</section>)}</section>
      </article><p className="attribution">The complete download places your cover before these report pages.</p></div></section>
    </section>
  </main>;
}
