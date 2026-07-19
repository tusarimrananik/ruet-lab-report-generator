import { EyeOpenIcon, Pencil2Icon } from '@radix-ui/react-icons';
import { useAtom } from 'jotai';
import type { LabReport } from './report-pdf';
import RUETLogo from '@/assets/RUET-Logo.png';
import { previewModeAtom } from '@/store/preview-mode';
import { ModeToggle } from './mode-toggle';
import PDFDownloadLink from './PDFDownloadLink';
import { Button } from './ui/button';

export function StudioTopbar({ report }: { report: LabReport }) {
  const [previewMode, setPreviewMode] = useAtom(previewModeAtom);
  return (
    <header className="studio-header">
      <div className="studio-identity">
        <img src={RUETLogo} alt="RUET" />
        <div>
          <strong>RUET</strong>
          <span>Document Builder</span>
        </div>
      </div>
      <div className="mobile-view-switch" aria-label="Workspace view">
        <button type="button" aria-label="Editor" className={!previewMode ? 'is-active' : ''} onClick={() => setPreviewMode(false)}>
          <Pencil2Icon /> <span>Editor</span>
        </button>
        <button type="button" aria-label="Preview" className={previewMode ? 'is-active' : ''} onClick={() => setPreviewMode(true)}>
          <EyeOpenIcon /> <span>Preview</span>
        </button>
      </div>
      <div className="studio-header-actions">
        <ModeToggle />
        <Button asChild className="studio-download">
          <PDFDownloadLink report={report} />
        </Button>
      </div>
    </header>
  );
}
