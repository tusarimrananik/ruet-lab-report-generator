import {
  ChevronDownIcon,
  IdCardIcon,
  MixerVerticalIcon,
  PersonIcon,
  ReaderIcon,
} from '@radix-ui/react-icons';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { type Dispatch, type SetStateAction, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  documentTypes,
  getDocumentSections,
  hasRemovedContent,
  mergeDocumentSections,
  titleStyles,
  type DocumentType,
  type TitleStyle,
} from '@/data/document-presets';
import {
  academicTerms,
  enabledUniversities,
  getDepartment,
  getSessionalCourses,
  getUniversity,
  type SessionalCourse,
} from '@/data/report-presets';
import editorStore, {
  Department,
  departments,
  designations,
  studentDepartments,
} from '@/store/editor';
import { teacherEffect } from '@/store/effects/editor';
import { previewModeAtom } from '@/store/preview-mode';
import { Switch } from '../ui/switch';
import { Combobox } from './combobox';
import { DateInput } from './DateInput';
import { FormDescription } from './form-description';
import { FormItem } from './form-item';
import { ImportExport } from './import-export';
import { SwitchInput } from './switch-input';
import { TeacherName } from './teacher-name';
import { TextInput } from './text-input';
import { TextAreaInput } from './textarea-input';
import LabReportGenerator from '../lab-report-generator';
import type { LabReport } from '../report-pdf';

const tabContentClass = cn(
  'cover-tab-content flex-1 flex-col gap-y-4 overflow-y-auto p-5 data-[state=active]:flex prose dark:prose-invert max-w-full',
);

export function Editor({ report, setReport }: { report: LabReport; setReport: Dispatch<SetStateAction<LabReport>> }) {
  const setTab = useSetAtom(editorStore.editorTab);
  const setPreviewMode = useSetAtom(previewModeAtom);
  const teacherName = useAtomValue(editorStore.teacherName);
  const secondTeacherName = useAtomValue(editorStore.secondTeacherName);
  const manualSubmittedBy = useAtomValue(editorStore.manualSubmittedBy);

  useAtom(teacherEffect);

  return (
    <div className="editor-frame">
      <Tabs
      defaultValue="student"
      className="flex flex-1 flex-col overflow-hidden"
      atom={editorStore.editorTab}
    >
      <TabsList className="cover-tabs h-auto w-full rounded-none">
        {(
          [
            ['student', PersonIcon, 'Student'],
            ['subject', ReaderIcon, 'Subject'],
            ['teacher', IdCardIcon, 'Teacher'],
            ['settings', MixerVerticalIcon, 'Settings'],
            ['report', ReaderIcon, 'Content'],
          ] as const
        ).map(([x, Icon, label]) => (
          <TabsTrigger value={x} className="cover-tab flex-1" key={x} aria-label={x}>
            <Icon className="size-5" />
            <span>{label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="student" className={tabContentClass}>
        <SwitchInput
          atom={editorStore.manualSubmittedBy}
          label="Manual Input"
        />
        {manualSubmittedBy ? (
          <FormItem label="Submitted By">
            <TextAreaInput atom={editorStore.manualSubmittedByText} rows={10} />
          </FormItem>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormItem label="Student ID">
                <TextInput atom={editorStore.studentID} />
              </FormItem>
              <FormItem label="Section">
                <TextInput atom={editorStore.studentSection} />
                <FormDescription>leave empty if not applicable</FormDescription>
              </FormItem>
            </div>
            <FormItem label="Full Name">
              <TextInput atom={editorStore.studentName} />
            </FormItem>
          </>
        )}
        <FormItem label="Department">
          <Combobox
            name="department"
            atom={editorStore.studentDepartment}
            options={studentDepartments.map((x) => ({ label: x, value: x }))}
          />
        </FormItem>
        <FormItem label="Group">
          <TextInput atom={editorStore.studentGroup} />
          <FormDescription>leave empty if not applicable</FormDescription>
        </FormItem>
        <Button
          variant="outline"
          className="mt-auto"
          onClick={() => setTab('subject')}
        >
          Next
        </Button>
      </TabsContent>
      <TabsContent value="subject" className={tabContentClass}>
        <TypeAndCoverNo documentType={report.documentType} />
        <FormItem label={`${report.documentType} Title`}>
          <TextAreaInput atom={editorStore.coverTitle} rows={3} />
          <FormDescription>leave empty if not applicable</FormDescription>
        </FormItem>
        <DateOfExperiment documentType={report.documentType} />
        <FormItem label="Date of submission">
          <DateInput atom={editorStore.dateOfSubmission} />
        </FormItem>
        <CO_PO />
        <Button
          variant="outline"
          className="mt-auto"
          onClick={() => setTab('teacher')}
        >
          Next
        </Button>
      </TabsContent>
      <TabsContent value="teacher" className={tabContentClass}>
        <FormItem label="Teacher Name">
          <TeacherName
            nameAtom={editorStore.teacherName}
            designationAtom={editorStore.teacherDesignation}
            departmentAtom={editorStore.teacherDepartment}
          />
        </FormItem>
        {!!teacherName && (
          <FormItem label="Designation">
            <Combobox
              name="designation"
              atom={editorStore.teacherDesignation}
              options={designations.map((x) => ({ label: x, value: x }))}
            />
          </FormItem>
        )}
        <FormItem label="Department">
          <Combobox
            name="department"
            atom={editorStore.teacherDepartment}
            options={departments.map((x) => ({ label: x, value: x }))}
          />
        </FormItem>
        {!!teacherName && (
          <>
            <hr className="-mx-4 mt-2 border-input" />
            <FormItem label="Second Teacher Name">
              <TeacherName
                nameAtom={editorStore.secondTeacherName}
                designationAtom={editorStore.secondTeacherDesignation}
                departmentAtom={editorStore.secondTeacherDepartment}
              />
            </FormItem>
            {!!secondTeacherName && (
              <>
                <FormItem label="Second Teacher Designation">
                  <Combobox
                    name="designation"
                    atom={editorStore.secondTeacherDesignation}
                    options={designations.map((x) => ({ label: x, value: x }))}
                  />
                </FormItem>
                <FormItem label="Second Teacher Department">
                  <Combobox
                    name="department"
                    atom={editorStore.secondTeacherDepartment}
                    options={departments.map((x) => ({ label: x, value: x }))}
                  />
                </FormItem>
              </>
            )}
            <hr className="-mx-4 mt-2 border-input" />
          </>
        )}
        <Button
          variant="outline"
          className="mt-auto max-lg:hidden"
          onClick={() => setTab('subject')}
        >
          Back
        </Button>
        <Button
          variant="outline"
          className="mt-auto lg:hidden"
          onClick={() => setPreviewMode(true)}
        >
          Let's go
        </Button>
      </TabsContent>
      <TabsContent value="settings" className={tabContentClass}>
        <SwitchInput
          atom={editorStore.formToBorder}
          label="Add borders to submitted by and submitted to table"
        />
        <SwitchInput atom={editorStore.watermark} label="Add watermark" />
        <SwitchInput
          atom={editorStore.courseCode}
          label="Use 'Course Code' instead of 'Course No.'"
        />
        <SwitchInput
          atom={editorStore.studentSeries}
          label="Show student series"
        />
        <SwitchInput
          atom={editorStore.studentSession}
          label="Show student session"
        />
        <SwitchInput
          atom={editorStore.courseInfoBellowTitle}
          label="Show course information bellow title"
        />
        <SwitchInput
          atom={editorStore.datesBellowTitle}
          label="Show dates bellow title instead of at the bottom"
        />
        <div>
          <ImportExport />
          <Button
            variant="destructive"
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
          >
            Reset all inputs and settings
          </Button>
        </div>
      </TabsContent>
      <TabsContent value="report" className="lab-report-tab-content flex-1 overflow-y-auto">
        <LabReportGenerator view="editor" report={report} setReport={setReport} />
      </TabsContent>
      </Tabs>
    </div>
  );
}

export function AcademicPresetBar({ report, setReport }: { report: LabReport; setReport: Dispatch<SetStateAction<LabReport>> }) {
  const [setupOpen, setSetupOpen] = useState(false);
  const setCoverType = useSetAtom(editorStore.type);
  const setStudentDepartment = useSetAtom(editorStore.studentDepartment);
  const setCourseNo = useSetAtom(editorStore.courseNo);
  const setCourseTitle = useSetAtom(editorStore.courseTitle);
  const university = getUniversity(report.university);
  const courses = getSessionalCourses(report.university, report.presetDepartment, report.semester);

  const commitPreset = (
    next: LabReport,
    course?: SessionalCourse,
    nextDocumentType: DocumentType = next.documentType,
  ) => {
    const format = course?.format ?? 'general';
    const template = getDocumentSections(nextDocumentType, format);
    if (hasRemovedContent(report.sections, template) && !window.confirm('Changing this preset will remove content from sections that are not used in the new format. Continue?')) return false;
    setReport({
      ...next,
      documentType: nextDocumentType,
      preset: nextDocumentType === 'Lab Report' ? format : nextDocumentType.toLowerCase().replace(' ', '-'),
      sessionalCourse: course?.code ?? next.sessionalCourse,
      courseCode: course?.code ?? next.courseCode,
      courseTitle: course?.title ?? next.courseTitle,
      sections: mergeDocumentSections(report.sections, template),
    });
    setCoverType(nextDocumentType);
    if (course) {
      setCourseNo(course.code);
      setCourseTitle(course.title);
    }
    return true;
  };

  const changeUniversity = (id: string) => {
    const nextUniversity = getUniversity(id);
    const department = nextUniversity.departments[0];
    const course = getSessionalCourses(id, department.code, report.semester)[0];
    const next = { ...report, university: id, presetDepartment: department.code, sessionalCourse: course?.code ?? '' };
    if (commitPreset(next, course)) setStudentDepartment(department.name as Department);
  };

  const changeDocumentType = (documentType: DocumentType) => {
    const course = courses.find((item) => item.code === report.sessionalCourse) ?? courses[0];
    commitPreset({ ...report, documentType }, course, documentType);
  };

  const changeDepartment = (code: string) => {
    const department = getDepartment(report.university, code);
    const course = getSessionalCourses(report.university, code, report.semester)[0];
    const next = { ...report, presetDepartment: code, sessionalCourse: course?.code ?? '' };
    if (commitPreset(next, course)) setStudentDepartment(department.name as Department);
  };

  const changeSemester = (semester: string) => {
    const course = getSessionalCourses(report.university, report.presetDepartment, semester)[0];
    commitPreset({ ...report, semester, sessionalCourse: course?.code ?? '' }, course);
  };

  const changeCourse = (code: string) => {
    const course = courses.find((item) => item.code === code);
    if (course) commitPreset({ ...report, sessionalCourse: code }, course);
  };

  return (
    <div className={cn('academic-preset-bar', setupOpen && 'is-open')}>
      <button type="button" className="academic-preset-toggle" aria-expanded={setupOpen} onClick={() => setSetupOpen((current) => !current)}>
        <span>Document setup</span>
        <strong>{university.shortName} · {report.documentType} · {report.sessionalCourse || 'No course'}</strong>
        <ChevronDownIcon />
      </button>
      <div className="academic-preset-fields">
        <label><span>University</span><select value={report.university} onChange={(event) => changeUniversity(event.target.value)}>{enabledUniversities.map((item) => <option value={item.id} key={item.id}>{item.shortName}</option>)}</select></label>
        <label><span>Document</span><select value={report.documentType} onChange={(event) => changeDocumentType(event.target.value as DocumentType)}>{documentTypes.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
        <label><span>Department</span><select value={report.presetDepartment} onChange={(event) => changeDepartment(event.target.value)}>{university.departments.map((item) => <option value={item.code} key={item.code}>{item.code}</option>)}</select></label>
        <label><span>Semester</span><select value={report.semester} onChange={(event) => changeSemester(event.target.value)}>{academicTerms.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
        <label className="academic-course-select"><span>Course</span><select value={courses.some((item) => item.code === report.sessionalCourse) ? report.sessionalCourse : ''} disabled={!courses.length} onChange={(event) => changeCourse(event.target.value)}>{courses.length ? courses.map((item) => <option value={item.code} key={item.code}>{item.code} — {item.title}</option>) : <option value="">Enter manually</option>}</select></label>
        <label><span>Style</span><select value={report.titleStyle} onChange={(event) => setReport((current) => ({ ...current, titleStyle: event.target.value as TitleStyle }))}>{titleStyles.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
      </div>
    </div>
  );
}

function DateOfExperiment({ documentType }: { documentType: DocumentType }) {
  return (
    documentType === 'Lab Report' && (
      <FormItem label="Date of experiment">
        <DateInput atom={editorStore.dateOfExperiment} />
      </FormItem>
    )
  );
}

function TypeAndCoverNo({ documentType }: { documentType: DocumentType }) {
  const [coverNo, setCoverNo] = useAtom(editorStore.coverNo);
  const numberLabel = documentType === 'Lab Report' ? 'Lab No.' : `${documentType} No.`;

  return (
    <div>
      {documentType !== 'Thesis' && (
        <FormItem
          label={numberLabel}
          actions={
            <Switch
              checked={coverNo !== ''}
              onCheckedChange={(x) => setCoverNo(x ? '1' : '')}
            />
          }
        >
          <TextInput
            atom={editorStore.coverNo}
            disabled={coverNo === ''}
            type="number"
            step={1}
            min={0}
          />
        </FormItem>
      )}
    </div>
  );
}

function CO_PO() {
  const assessmentTable = useAtomValue(editorStore.assessmentTable);

  return (
    <>
      <h3 className="mb-0">Assessment table</h3>
      <SwitchInput
        atom={editorStore.assessmentTable}
        label="Show assessment table"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormItem label="CO">
          <TextInput atom={editorStore.CO} disabled={!assessmentTable} />
        </FormItem>
        <FormItem label="PO">
          <TextInput atom={editorStore.PO} disabled={!assessmentTable} />
        </FormItem>
      </div>
    </>
  );
}
