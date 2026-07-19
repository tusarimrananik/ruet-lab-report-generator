"use client";

import { ChangeEvent, Dispatch, SetStateAction, useMemo, useState } from "react";
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import editorStore from '@/store/editor';
import { getDocumentSections } from '@/data/document-presets';
import { getDepartment, getSessionalCourses, getUniversity } from '@/data/report-presets';
import { LabReport, ReportDocument } from './report-pdf';
import { PaginatedPDFViewer } from './PDFViewer';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

type Report = LabReport;

export const initialLabReport: Report = {
  documentType:"Lab Report", titleStyle:"bold",
  preset:"assembly", university:"ruet", presetDepartment:"CSE", semester:"2-2", sessionalCourse:"CSE 2206",
  department:"Computer Science & Engineering", courseCode:"CSE 2206",
  courseTitle:"Microprocessors, Microcontrollers and Assembly Language Sessional", labNo:"01",
  labTitle:"", experimentDate:"", submissionDate:"",
  studentName:"", roll:"", section:"", series:"",
  teacherName:"", teacherTitle:"",
  sections: getDocumentSections('Lab Report', 'assembly'),
};

export default function Home({ view, report, setReport }: { view: "editor" | "preview"; report: Report; setReport: Dispatch<SetStateAction<Report>> }) {
  const [generating,setGenerating] = useState(false);
  const [aiNotes,setAiNotes] = useState("");
  const [aiMessage,setAiMessage] = useState("");
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
  const selectedCourse=useMemo(()=>sessionalCourses.find(course=>course.code===report.sessionalCourse)??sessionalCourses[0]??{code:courseCode,title:courseTitle,format:"general" as const},[sessionalCourses,report.sessionalCourse,courseCode,courseTitle]);
  const reportForExport=useMemo<Report>(()=>({...report,department:department||selectedDepartment.name,courseCode,courseTitle,labNo,labTitle,experimentDate:experimentDate?dayjs(experimentDate).format('YYYY-MM-DD'):'',submissionDate:submissionDate?dayjs(submissionDate).format('YYYY-MM-DD'):'',studentName,roll,section,series:roll.slice(0,2),teacherName,teacherTitle}),[report,department,selectedDepartment.name,courseCode,courseTitle,labNo,labTitle,experimentDate,submissionDate,studentName,roll,section,teacherName,teacherTitle]);
  const complete=useMemo(()=>Math.round((report.sections.filter(s=>s.body.trim()).length/report.sections.length)*100),[report.sections]);
  const updateSection=(id:string,body:string)=>setReport(r=>({...r,sections:r.sections.map(s=>s.id===id?{...s,body}:s)}));
  const addImage=(id:string,e:ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;const reader=new FileReader();reader.onload=()=>updateSection(id,`${report.sections.find(s=>s.id===id)?.body||""}\n\n[IMAGE:${reader.result}]`);reader.readAsDataURL(f)};
  const fillWithAI=async()=>{
    if(!selectedCourse){setAiMessage("No verified sessional course data is available for this RUET department yet.");return;}
    if(!reportForExport.labTitle.trim()){setAiMessage(`Add the ${report.documentType} title on the Subject tab first.`);return;}
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
  if(view === "preview") return <div className="integrated-report-preview"><PaginatedPDFViewer className="report-pdf-preview"><ReportDocument report={reportForExport}/></PaginatedPDFViewer></div>;
  return <main className="report-studio integrated-report-editor">
    <section className="report-workspace">
      <aside className="report-editor">
        <div className="report-panel">
          <div className="report-utility-row"><span className="progress"><b>{complete}%</b> complete</span></div>
          <div className="ai-fill-card">
            <div className="ai-fill-heading"><strong>AI assistant</strong><span className="ai-badge">AI</span></div>
            <Textarea rows={4} value={aiNotes} onChange={e=>setAiNotes(e.target.value)} placeholder={`Optional: paste the ${report.documentType.toLowerCase()} instructions, source material, data, or teacher requirements.`}/>
            <div className="ai-fill-actions">{aiMessage&&<span>{aiMessage}</span>}<Button type="button" size="sm" disabled={generating||!selectedCourse} onClick={fillWithAI}>{generating?"Generating…":"Fill empty sections"}</Button></div>
          </div>
          {report.sections.map((s,i)=><div className="section-edit" key={s.id}><div className="section-label"><div><span>{String(i+1).padStart(2,"0")}</span><strong>{s.title}</strong></div><label className="image-add">+ Add image<input hidden type="file" accept="image/*" onChange={e=>addImage(s.id,e)}/></label></div><Textarea className={s.kind==="code"?"code-input":""} rows={s.kind==="code"?12:5} placeholder={s.placeholder} value={s.body} onChange={e=>updateSection(s.id,e.target.value)}/></div>)}
        </div>
      </aside>
    </section>
  </main>;
}
