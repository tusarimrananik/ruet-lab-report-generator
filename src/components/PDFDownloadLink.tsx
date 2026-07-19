import { DownloadIcon } from '@radix-ui/react-icons';
import { Document, pdf } from '@react-pdf/renderer';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { type ComponentProps, type MouseEvent, useState } from 'react';
import { defaultStore } from '@/store';
import editor from '@/store/editor';
import { CoverPage } from './cover-template';
import { type LabReport, ReportPage } from './report-pdf';
import { LoadingSpinner } from './ui/loading-spinner';

export const PDFDownloadLink = ({
  report,
  ...props
}: { report: LabReport } & ComponentProps<'button'>) => {
  const [isPending, setIsPending] = useState(false);
  const department = useAtomValue(editor.studentDepartment);
  const labNo = useAtomValue(editor.coverNo);
  const labTitle = useAtomValue(editor.coverTitle);
  const experimentDate = useAtomValue(editor.dateOfExperiment);
  const submissionDate = useAtomValue(editor.dateOfSubmission);
  const studentName = useAtomValue(editor.studentName);
  const roll = useAtomValue(editor.studentID);
  const section = useAtomValue(editor.studentSection);
  const teacherName = useAtomValue(editor.teacherName);
  const teacherTitle = useAtomValue(editor.teacherDesignation);
  const completeReport: LabReport = {
    ...report,
    department,
    courseCode: report.courseCode,
    courseTitle: report.courseTitle,
    labNo,
    labTitle,
    experimentDate: experimentDate ? dayjs(experimentDate).format('YYYY-MM-DD') : '',
    submissionDate: submissionDate ? dayjs(submissionDate).format('YYYY-MM-DD') : '',
    studentName,
    roll,
    section,
    series: roll.slice(0, 2),
    teacherName,
    teacherTitle,
  };
  const fileNameClean = `${report.courseCode || 'RUET'}-${report.documentType.replace(/\s+/g, '-')}-${labNo || 'Document'}.pdf`
    .replace(' ', '_')
    .replace(/[^a-zA-Z0-9.\-_]/g, '');

  const handleClick = async (
    _event: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>,
  ) => {
    if (isPending) return;
    setIsPending(true);
    try {
        const blob = await pdf(
          <Document title={`${completeReport.courseCode} ${completeReport.documentType}`}>
            <CoverPage report={completeReport} />
            <ReportPage report={completeReport} />
          </Document>,
        ).toBlob();
        if (window.navigator.userAgent === 'ruet-cover-page-gen') {
          const fileReader = new FileReader();
          fileReader.onloadend = () => {
            (
              window as {
                ReactNativeWebView?: {
                  postMessage(msg: string): void;
                };
              }
            ).ReactNativeWebView?.postMessage(
              JSON.stringify({
                dataURI: fileReader.result,
                fileName: fileNameClean,
              }),
            );
          };
          fileReader.readAsDataURL(blob);
          return;
        }
        const downloadUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = fileNameClean;
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
    } catch (error) {
      console.error(error);
      alert('Could not download the complete report.');
    } finally {
      setIsPending(false);
    }
    try {
      // @ts-expect-error
      window.umami?.track('download-cover-page', {
        studentId: defaultStore.get(editor.studentID) || 'Blank',
        courseNo: report.courseCode || 'Blank',
        courseTitle: report.courseTitle || 'Blank',
        teacher: defaultStore.get(editor.teacherName) || 'Blank',
        watermark: defaultStore.get(editor.watermark) ? 'true' : 'false',
      });
    } catch (_err) {
      console.error();
    }
  };

  return (
    <button type="button" onClick={handleClick} disabled={isPending} {...props}>
      {isPending ? (
        <LoadingSpinner />
      ) : (
        <DownloadIcon className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">Download</span>
    </button>
  );
};

export default PDFDownloadLink;
