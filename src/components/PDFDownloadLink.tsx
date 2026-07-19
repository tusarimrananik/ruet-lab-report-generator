import { DownloadIcon } from '@radix-ui/react-icons';
import { pdf } from '@react-pdf/renderer';
import { fileSave } from 'browser-fs-access';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { PDFDocument } from 'pdf-lib';
import { type ComponentProps, type MouseEvent, useTransition } from 'react';
import { defaultStore } from '@/store';
import editor from '@/store/editor';
import { CoverTemplate } from './cover-template';
import { type LabReport, ReportDocument } from './report-pdf';
import { LoadingSpinner } from './ui/loading-spinner';

export const PDFDownloadLink = ({
  report,
  ...props
}: { report: LabReport } & ComponentProps<'button'>) => {
  const [isPending, startTransition] = useTransition();
  const department = useAtomValue(editor.studentDepartment);
  const courseCode = useAtomValue(editor.courseNo);
  const courseTitle = useAtomValue(editor.courseTitle);
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
    courseCode,
    courseTitle,
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
  const fileNameClean = `${courseCode || 'RUET'}-${report.documentType.replace(/\s+/g, '-')}-${labNo || 'Document'}.pdf`
    .replace(' ', '_')
    .replace(/[^a-zA-Z0-9.\-_]/g, '');

  const handleClick = (
    _event: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>,
  ) => {
    startTransition(async () => {
      try {
        const [coverBlob, reportBlob] = await Promise.all([
          pdf(<CoverTemplate key={Math.random()} report={completeReport} />).toBlob(),
          pdf(<ReportDocument report={completeReport} />).toBlob(),
        ]);
        const merged = await PDFDocument.create();
        for (const sourceBlob of [coverBlob, reportBlob]) {
          const source = await PDFDocument.load(await sourceBlob.arrayBuffer());
          const pages = await merged.copyPages(source, source.getPageIndices());
          pages.forEach((page) => merged.addPage(page));
        }
        const bytes = await merged.save();
        const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: 'application/pdf' });
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
        await fileSave(blob, {
          fileName: fileNameClean,
          extensions: ['.pdf'],
        });
      } catch (error) {
        console.error(error);
        alert('Could not download the complete report.');
      }
    });
    try {
      // @ts-expect-error
      window.umami?.track('download-cover-page', {
        studentId: defaultStore.get(editor.studentID) || 'Blank',
        courseNo: defaultStore.get(editor.courseNo) || 'Blank',
        courseTitle: defaultStore.get(editor.courseTitle) || 'Blank',
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
