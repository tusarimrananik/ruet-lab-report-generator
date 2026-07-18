"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { pdf } from '@react-pdf/renderer';
import { fileSave } from 'browser-fs-access';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { PDFDocument } from 'pdf-lib';
import editorStore from '@/store/editor';
import { CoverTemplate } from './cover-template';
import { LabReport, ReportDocument, ReportSection } from './report-pdf';

type Section = ReportSection;
type Report = LabReport;

const presets: Record<string, { label: string; sections: Section[] }> = {
  assembly: { label: "Assembly / Microprocessor", sections: [
    ["objective","Objective","State the purpose of the experiment clearly. Use bullet points for multiple objectives."],
    ["theory","Theory","Explain the instructions, registers, addressing modes, or concepts needed to understand the work."],
    ["algorithm","Algorithm or Procedure","1. Initialize the program.\n2. Take or assign input values.\n3. Perform the required operations.\n4. Display or store the result.\n5. Terminate the program."],
    ["code","Source Code","; Paste complete, executable and commented code here","code"],
    ["explanation","Code Explanation","Explain the important program blocks, register usage, operations, jumps, output, and termination."],
    ["output","Output and Observation","Add result screenshots below and describe important register, flag, memory, or output values."],
    ["result","Result and Verdict","State the final result and whether it matches the expected output."],
    ["discussion","Discussion","Discuss how the program works, errors corrected, limitations, and possible improvements."],
    ["conclusion","Conclusion","Summarize the concepts and practical skills learned from the experiment."],
  ].map(([id,title,body,kind])=>({id,title,body,kind: kind as Section["kind"]})) },
  programming: { label: "Programming / Logic", sections: [
    ["objective","Objective","Describe what the problem or exercise verifies."],
    ["theory","Theory","Explain the relevant ideas, definitions, formulae, or logical rules."],
    ["algorithm","Algorithm","1. List inputs and assumptions.\n2. Describe the steps.\n3. Compute or evaluate the result.\n4. Display the output."],
    ["code","Code","# Paste clean, runnable code here","code"],
    ["output","Sample Output","Paste the output or add an observation."],
    ["discussion","Discussion","Interpret the output and explain any noteworthy cases."],
    ["conclusion","Conclusion","Summarize what was verified and learned."],
  ].map(([id,title,body,kind])=>({id,title,body,kind: kind as Section["kind"]})) },
  electrical: { label: "Electrical / Instrumentation", sections: [
    ["objectives","Objectives","1. State the primary objective.\n2. Add any comparison or verification objective."],
    ["theory","Theory","Explain the operating principle, relationships, and relevant formulae."],
    ["apparatus","Required Apparatus","1. List equipment\n2. Include ratings or quantities where useful"],
    ["diagram","Circuit Diagram","Insert the circuit diagram using the image button, then add a figure caption."],
    ["procedure","Procedure","1. Describe connections and safety checks.\n2. Explain how readings were taken.\n3. State how results were calculated."],
    ["data","Data Table and Calculations","Add measured values, units, equations, sample calculations, and percentage error."],
    ["result","Result and Discussion","Compare experimental and theoretical values. Discuss errors, losses, and instrument limitations."],
    ["conclusion","Conclusion","State whether the experiment verified the expected behaviour."],
  ].map(([id,title,body])=>({id,title,body})) },
};

const initial: Report = {
  preset:"assembly", department:"Computer Science & Engineering", courseCode:"CSE 2206",
  courseTitle:"Microprocessors, Microcontrollers and Assembly Language Sessional", labNo:"01",
  labTitle:"Allocation of Memory Values with 8-bit Registers", experimentDate:"", submissionDate:"",
  studentName:"Md. Tusar Imran", roll:"2303096", section:"B", series:"23",
  teacherName:"Md. Sozib Hossain", teacherTitle:"Assistant Professor",
  sections: presets.assembly.sections,
};

export default function Home() {
  const [report,setReport] = useState<Report>(()=>{if(typeof window==="undefined")return initial;const raw=localStorage.getItem("ruet-report-draft");if(!raw)return initial;try{return JSON.parse(raw)}catch{return initial}});
  const [saved,setSaved] = useState("Draft saved locally");
  const [downloading,setDownloading] = useState(false);
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
  const reportForExport=useMemo<Report>(()=>({...report,department,courseCode,courseTitle,labNo,labTitle,experimentDate:experimentDate?dayjs(experimentDate).format('YYYY-MM-DD'):'',submissionDate:submissionDate?dayjs(submissionDate).format('YYYY-MM-DD'):'',studentName,roll,section,series:roll.slice(0,2),teacherName,teacherTitle}),[report,department,courseCode,courseTitle,labNo,labTitle,experimentDate,submissionDate,studentName,roll,section,teacherName,teacherTitle]);
  useEffect(()=>{ const t=setTimeout(()=>{localStorage.setItem("ruet-report-draft",JSON.stringify(report));setSaved("Saved just now");},350); return()=>clearTimeout(t);},[report]);
  const complete=useMemo(()=>Math.round((report.sections.filter(s=>s.body.trim()).length/report.sections.length)*100),[report.sections]);
  const changePreset=(key:string)=>setReport(r=>({...r,preset:key,sections:presets[key].sections.map(s=>({...s}))}));
  const updateSection=(id:string,body:string)=>setReport(r=>({...r,sections:r.sections.map(s=>s.id===id?{...s,body}:s)}));
  const addImage=(id:string,e:ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;const reader=new FileReader();reader.onload=()=>updateSection(id,`${report.sections.find(s=>s.id===id)?.body||""}\n\n[IMAGE:${reader.result}]`);reader.readAsDataURL(f)};
  const exportWord=()=>{const body=document.querySelector(".paper")?.innerHTML||"";const html=`<html><head><meta charset="utf-8"><style>body{font-family:'Times New Roman';font-size:12pt;line-height:1.5}pre{font-family:'Courier New';font-size:11pt;border:1px solid #333;padding:12px}h2{font-size:16pt}.section{margin:22px 0}</style></head><body>${body}</body></html>`;const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([html],{type:"application/msword"}));a.download=`${reportForExport.courseCode}-Lab-${reportForExport.labNo}.doc`;a.click();};
  const backup=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(reportForExport,null,2)],{type:"application/json"}));a.download="ruet-lab-report.json";a.click()};
  const importDraft=(e:ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{setReport(JSON.parse(String(rd.result)));}catch{alert("That file is not a valid report backup.")}};rd.readAsText(f)};
  const downloadCompleteReport=async()=>{setDownloading(true);try{const [coverBlob,reportBlob]=await Promise.all([pdf(<CoverTemplate/>).toBlob(),pdf(<ReportDocument report={reportForExport}/>).toBlob()]);const merged=await PDFDocument.create();for(const blob of [coverBlob,reportBlob]){const source=await PDFDocument.load(await blob.arrayBuffer());const pages=await merged.copyPages(source,source.getPageIndices());pages.forEach(page=>merged.addPage(page));}const bytes=await merged.save();await fileSave(new Blob([bytes],{type:"application/pdf"}),{fileName:`${reportForExport.courseCode || "RUET"}-Lab-${reportForExport.labNo || "Report"}.pdf`,extensions:[".pdf"]});}catch(error){console.error(error);alert("Could not create the complete report PDF.");}finally{setDownloading(false)}};
  return <main className="report-studio">
    <header className="topbar">
      <div className="brand"><span className="brandmark">R</span><div><strong>Reportor</strong><small>RUET lab report studio</small></div></div>
      <div className="actions"><span className="saved"><i/> {saved}</span><button className="quiet" onClick={backup}>Backup</button><button className="quiet" onClick={()=>fileRef.current?.click()}>Import</button><input ref={fileRef} hidden type="file" accept="application/json" onChange={importDraft}/><button className="quiet" onClick={exportWord}>Word</button><button className="primary" disabled={downloading} onClick={downloadCompleteReport}>{downloading?"Preparing…":"Download Complete Report"}</button></div>
    </header>
    <section className="workspace">
      <aside className="editor">
        <div className="editor-head"><div><p className="eyebrow">REPORT CONTENT</p><h1>Write your lab report.</h1></div><span className="progress">{complete}% ready</span></div>
        <div className="panel content-panel">
          <label>Report preset<select value={report.preset} onChange={e=>changePreset(e.target.value)}>{Object.entries(presets).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></label>
          <p className="hint">Cover details are used automatically. Add only the report content here.</p>
          {report.sections.map((s,i)=><div className="section-edit" key={s.id}><div className="section-label"><span>{String(i+1).padStart(2,"0")}</span><strong>{s.title}</strong><label className="image-add">+ image<input hidden type="file" accept="image/*" onChange={e=>addImage(s.id,e)}/></label></div><textarea className={s.kind==="code"?"code-input":""} rows={s.kind==="code"?9:5} value={s.body} onChange={e=>updateSection(s.id,e.target.value)}/></div>)}
        </div>
      </aside>
      <section className="preview-wrap"><div className="preview-title"><span>LAB REPORT PREVIEW</span><span>Times New Roman · 12 pt</span></div><article className="paper report-paper">
        <section className="report-body"><h1>Lab No. {reportForExport.labNo}: {reportForExport.labTitle}</h1>{report.sections.map(s=><section className="report-section" key={s.id}><h2>{s.title}</h2>{s.body.split(/(\[IMAGE:data:image\/[^\]]+\])/).map((part,i)=>part.startsWith("[IMAGE:")?/* eslint-disable-next-line @next/next/no-img-element */<img key={i} src={part.slice(7,-1)} alt="Report figure"/>:s.kind==="code"?<pre key={i}>{part}</pre>:<p key={i}>{part}</p>)}</section>)}</section>
      </article><p className="attribution">The downloaded PDF automatically places your completed cover before these report pages.</p></section>
    </section>
  </main>;
}
