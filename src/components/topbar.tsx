import { ArrowLeftIcon, EyeOpenIcon } from '@radix-ui/react-icons';
import { useAtomValue, useSetAtom } from 'jotai';
import { useMemo } from 'react';
import icon from '@/assets/icon.svg';
import atoms from '@/store/editor';
import { previewModeAtom } from '@/store/preview-mode';
import { ModeToggle } from './mode-toggle';
import PDFDownloadLink from './PDFDownloadLink';
import { Button } from './ui/button';

export function TopbarLeft() {
  const setPreviewMode = useSetAtom(previewModeAtom);
  return (
    <div className="cover-pane-toolbar">
      <div className="cover-pane-title">
        <span className="cover-pane-icon"><img src={icon} alt="" /></span>
        <h1>Cover Page</h1>
      </div>
      <div className="flex items-center gap-2">
        <ModeToggle />
        <Button
          variant="outline"
          size="icon"
          onClick={() => setPreviewMode(true)}
          className="lg:hidden"
        >
          <EyeOpenIcon className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Back</span>
        </Button>
      </div>
    </div>
  );
}

export function TopbarRight() {
  const setPreviewMode = useSetAtom(previewModeAtom);
  const courseNo = useAtomValue(atoms.courseNo);
  const studentID = useAtomValue(atoms.studentID);
  const coverNo = useAtomValue(atoms.coverNo);
  const filename = useMemo(() => {
    const parts = [
      'Cover',
      courseNo,
      studentID,
      coverNo.padStart(2, '0'),
    ].filter(Boolean);
    return parts.join('-');
  }, [courseNo, studentID, coverNo]);

  return (
    <div className="cover-pane-toolbar cover-preview-header">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setPreviewMode(false)}
        className="lg:hidden"
      >
        <ArrowLeftIcon className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Back</span>
      </Button>
      <div className="ms-auto">
        <Button variant="outline" size="icon" asChild>
          <PDFDownloadLink fileName={`${filename}.pdf`} />
        </Button>
      </div>
    </div>
  );
}
