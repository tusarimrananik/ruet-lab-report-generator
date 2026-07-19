import { useAtomValue } from 'jotai';
import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { CoverTemplate } from './components/cover-template';
import { Editor } from './components/editor/editor';
import { InApp } from './components/in-app';
import { PDFViewer } from './components/PDFViewer';
import { TopbarLeft, TopbarRight } from './components/topbar';
import { Update } from './components/update';
import { cn } from './lib/utils';
import { previewModeAtom } from './store/preview-mode';
import LabReportGenerator, { initialLabReport } from './components/lab-report-generator';
import type { LabReport } from './components/report-pdf';
import './lab-report.css';

const mql = window.matchMedia('(max-width: 1023px)');
const queryClient = new QueryClient();

const CoverApp = () => {
  const previewMode = useAtomValue(previewModeAtom);
  const [isMobile, setIsMobile] = useState(mql.matches);
  const [previewModeDebounced] = useDebounce(previewMode, 350);
  const [report, setReport] = useState<LabReport>(initialLabReport);

  useEffect(() => {
    const handleChange = (event: { matches: boolean }) =>
      setIsMobile(event.matches);
    mql.addEventListener('change', handleChange);

    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return (
    <main className="cover-workspace">
      <QueryClientProvider client={queryClient}>
        <div
          className={cn(
            'cover-editor-pane flex min-w-0 flex-1 origin-left flex-col transition-all',
            previewMode && 'max-lg:invisible max-lg:grow-0 max-lg:scale-x-0',
          )}
        >
          <TopbarLeft />
          <Editor report={report} setReport={setReport} />
        </div>
        {(!isMobile || previewMode) && (
          <div
            className={cn(
              'cover-preview-pane flex min-w-0 flex-1 origin-left flex-col transition-all',
              previewMode || 'max-lg:invisible max-lg:grow-0 max-lg:scale-x-0',
            )}
          >
            <TopbarRight report={report} />
            {!isMobile || previewModeDebounced ? (
              <div className="document-preview-stack">
                <section className="document-preview-item cover-preview-item">
                  <PDFViewer className="cover-document-preview">{<CoverTemplate report={report} />}</PDFViewer>
                </section>
                <section className="document-preview-item report-document-preview">
                  <LabReportGenerator view="preview" report={report} setReport={setReport} />
                </section>
              </div>
            ) : (
              <div
                className={cn(
                  'relative flex overflow-hidden flex-1 grow shrink',
                )}
              >
                <div className="absolute inset-0 flex justify-center items-center">
                  <div className="lds-facebook text-neutral-700">
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </QueryClientProvider>
      <InApp />
      <Update />
    </main>
  );
};

const App = () => {
  return <CoverApp />;
};

export default App;
