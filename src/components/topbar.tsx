import { ArrowLeftIcon, EyeOpenIcon } from '@radix-ui/react-icons';
import { useSetAtom } from 'jotai';
import type { LabReport } from './report-pdf';
import icon from '@/assets/icon.svg';
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

export function TopbarRight({ report }: { report: LabReport }) {
  const setPreviewMode = useSetAtom(previewModeAtom);

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
          <PDFDownloadLink report={report} />
        </Button>
      </div>
    </div>
  );
}
