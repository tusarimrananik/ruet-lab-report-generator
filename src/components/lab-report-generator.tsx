"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type Section = { id: string; title: string; body: string; kind?: "code" | "text" };
type Report = {
  preset: string; department: string; courseCode: string; courseTitle: string;
  labNo: string; labTitle: string; experimentDate: string; submissionDate: string;
  studentName: string; roll: string; section: string; series: string;
  teacherName: string; teacherTitle: string; sections: Section[];
};

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
  const [tab,setTab] = useState<"details"|"content">("details");
  const [saved,setSaved] = useState("Draft saved locally");
  const fileRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{ const t=setTimeout(()=>{localStorage.setItem("ruet-report-draft",JSON.stringify(report));setSaved("Saved just now");},350); return()=>clearTimeout(t);},[report]);
  const complete=useMemo(()=>Math.round(([report.courseCode,report.courseTitle,report.labNo,report.labTitle,report.studentName,report.roll,report.teacherName,...report.sections.map(s=>s.body)].filter(Boolean).length/(7+report.sections.length))*100),[report]);
  const field=(key:keyof Report,value:string)=>setReport(r=>({...r,[key]:value}));
  const changePreset=(key:string)=>setReport(r=>({...r,preset:key,sections:presets[key].sections.map(s=>({...s}))}));
  const updateSection=(id:string,body:string)=>setReport(r=>({...r,sections:r.sections.map(s=>s.id===id?{...s,body}:s)}));
  const addImage=(id:string,e:ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;const reader=new FileReader();reader.onload=()=>updateSection(id,`${report.sections.find(s=>s.id===id)?.body||""}\n\n[IMAGE:${reader.result}]`);reader.readAsDataURL(f)};
  const exportWord=()=>{const body=document.querySelector(".paper")?.innerHTML||"";const html=`<html><head><meta charset="utf-8"><style>body{font-family:'Times New Roman';font-size:12pt;line-height:1.5}pre{font-family:'Courier New';font-size:11pt;border:1px solid #333;padding:12px}h2{font-size:16pt}.cover{text-align:center;page-break-after:always}.split{display:flex;justify-content:space-between;text-align:left}.section{margin:22px 0}</style></head><body>${body}</body></html>`;const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([html],{type:"application/msword"}));a.download=`${report.courseCode}-Lab-${report.labNo}.doc`;a.click();};
  const backup=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:"application/json"}));a.download="ruet-lab-report.json";a.click()};
  const importDraft=(e:ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{setReport(JSON.parse(String(rd.result)));}catch{alert("That file is not a valid report backup.")}};rd.readAsText(f)};
  return <main>
    <header className="topbar">
      <div className="brand"><span className="brandmark">R</span><div><strong>Reportor</strong><small>RUET lab report studio</small></div></div>
      <div className="actions"><span className="saved"><i/> {saved}</span><button className="quiet" onClick={backup}>Backup</button><button className="quiet" onClick={()=>fileRef.current?.click()}>Import</button><input ref={fileRef} hidden type="file" accept="application/json" onChange={importDraft}/><button className="quiet" onClick={exportWord}>Word</button><button className="primary" onClick={()=>window.print()}>Export PDF</button></div>
    </header>
    <section className="workspace">
      <aside className="editor">
        <div className="editor-head"><div><p className="eyebrow">REPORT BUILDER</p><h1>Create with confidence.</h1></div><span className="progress">{complete}% ready</span></div>
        <div className="tabs"><button className={tab==="details"?"active":""} onClick={()=>setTab("details")}>01 · Details</button><button className={tab==="content"?"active":""} onClick={()=>setTab("content")}>02 · Content</button></div>
        {tab==="details" ? <div className="panel">
          <label>Report preset<select value={report.preset} onChange={e=>changePreset(e.target.value)}>{Object.entries(presets).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></label>
          <div className="rule"><span>Course</span></div>
          <label>Department<input value={report.department} onChange={e=>field("department",e.target.value)}/></label>
          <div className="grid2"><label>Course code<input value={report.courseCode} onChange={e=>field("courseCode",e.target.value)}/></label><label>Lab no.<input value={report.labNo} onChange={e=>field("labNo",e.target.value)}/></label></div>
          <label>Course title<input value={report.courseTitle} onChange={e=>field("courseTitle",e.target.value)}/></label>
          <label>Lab title<textarea rows={2} value={report.labTitle} onChange={e=>field("labTitle",e.target.value)}/></label>
          <div className="grid2"><label>Experiment date<input type="date" value={report.experimentDate} onChange={e=>field("experimentDate",e.target.value)}/></label><label>Submission date<input type="date" value={report.submissionDate} onChange={e=>field("submissionDate",e.target.value)}/></label></div>
          <div className="rule"><span>People</span></div>
          <label>Your name<input value={report.studentName} onChange={e=>field("studentName",e.target.value)}/></label>
          <div className="grid3"><label>Roll<input value={report.roll} onChange={e=>field("roll",e.target.value)}/></label><label>Section<input value={report.section} onChange={e=>field("section",e.target.value)}/></label><label>Series<input value={report.series} onChange={e=>field("series",e.target.value)}/></label></div>
          <label>Submitted to<input value={report.teacherName} onChange={e=>field("teacherName",e.target.value)}/></label>
          <label>Teacher designation<input value={report.teacherTitle} onChange={e=>field("teacherTitle",e.target.value)}/></label>
          <button className="next" onClick={()=>setTab("content")}>Continue to content <span>→</span></button>
        </div> : <div className="panel content-panel">
          <p className="hint">Use the template prompts as a guide. Your wording is never sent anywhere.</p>
          {report.sections.map((s,i)=><div className="section-edit" key={s.id}><div className="section-label"><span>{String(i+1).padStart(2,"0")}</span><strong>{s.title}</strong><label className="image-add">+ image<input hidden type="file" accept="image/*" onChange={e=>addImage(s.id,e)}/></label></div><textarea className={s.kind==="code"?"code-input":""} rows={s.kind==="code"?9:5} value={s.body} onChange={e=>updateSection(s.id,e.target.value)}/></div>)}
        </div>}
      </aside>
      <section className="preview-wrap"><div className="preview-title"><span>LIVE A4 PREVIEW</span><span>Times New Roman · 12 pt</span></div><article className="paper">
        <section className="cover">
          <p className="motto">Heaven’s Light is Our Guide</p><h2>Rajshahi University of Engineering &amp; Technology</h2><img className="ruet-logo" src="/RUET-Logo.png" alt="RUET emblem"/><p>Department of {report.department}</p><p>{report.series} Series</p>
          <div className="course"><p>Course Code: {report.courseCode}</p><p>Course Title: {report.courseTitle}</p></div>
          <div className="lab-meta"><p><b>Lab No.</b><span>:</span>{report.labNo}</p><p><b>Lab Title</b><span>:</span>{report.labTitle}</p></div>
          <div className="split"><div><h3>Submitted by:</h3><p>{report.studentName}</p><p>Roll: {report.roll}</p><p>Section: {report.section}</p></div><div><h3>Submitted to:</h3><p>{report.teacherName}</p><p>{report.teacherTitle}</p><p>Dept. of {report.department}, RUET</p></div></div>
          <div className="dates"><p><b>Date of Experiment</b><span>:</span>{report.experimentDate||"—"}</p><p><b>Date of Submission</b><span>:</span>{report.submissionDate||"—"}</p></div>
        </section>
        <section className="report-body"><h1>Lab No. {report.labNo}: {report.labTitle}</h1>{report.sections.map(s=><section className="report-section" key={s.id}><h2>{s.title}</h2>{s.body.split(/(\[IMAGE:data:image\/[^\]]+\])/).map((part,i)=>part.startsWith("[IMAGE:")?/* eslint-disable-next-line @next/next/no-img-element */<img key={i} src={part.slice(7,-1)} alt="Report figure"/>:s.kind==="code"?<pre key={i}>{part}</pre>:<p key={i}>{part}</p>)}</section>)}</section>
      </article><p className="attribution">Cover layout adapted from the MIT-licensed ruet-cover-page project.</p></section>
    </section>
  </main>;
}
