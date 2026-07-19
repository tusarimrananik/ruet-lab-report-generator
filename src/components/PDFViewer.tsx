import {
  type DocumentProps,
  type UsePDFInstance,
  usePDF,
} from '@react-pdf/renderer';
import {
  memo,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useDebouncedCallback } from 'use-debounce';
import { useResizeObserver } from 'usehooks-ts';
import { cn } from '@/lib/utils';
import { coverSkeleton } from './cover-skeleton';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

type Size = {
  width?: number;
  height?: number;
};

const MemoizedPDFViewer = memo(
  ({
    debouncedInstance,
    fitSize,
    setDebouncedInstance,
    isLoadingRef,
    instanceRef,
    allPages,
  }: {
    debouncedInstance: UsePDFInstance;
    fitSize: { width: number; height: number } | undefined;
    setDebouncedInstance: React.Dispatch<React.SetStateAction<UsePDFInstance>>;
    isLoadingRef: React.RefObject<boolean>;
    instanceRef: React.RefObject<UsePDFInstance>;
    allPages: boolean;
  }) => {
    const [numPages, setNumPages] = useState(1);
    isLoadingRef.current = true;
    const loading = (
      <div
        className="flex flex-col items-center justify-center gap-[4%] bg-white p-[16%]"
        style={fitSize}
      >
        {coverSkeleton}
      </div>
    );
    const finishUpdate = () => {
      isLoadingRef.current = false;
      if (debouncedInstance.blob === instanceRef.current.blob) return;
      setDebouncedInstance(instanceRef.current);
    };
    const handleUpdate = ({ numPages: loadedPages }: { numPages: number }) => {
      setNumPages(loadedPages);
      finishUpdate();
    };

    return (
      <Document
        file={debouncedInstance.blob}
        loading={loading}
        className={allPages ? 'm-auto flex flex-col gap-4' : 'm-auto'}
        onLoadSuccess={handleUpdate}
        onLoadError={finishUpdate}
        onSourceError={finishUpdate}
      >
        {Array.from({ length: allPages ? numPages : 1 }, (_, index) => (
          <Page
            key={index + 1}
            pageNumber={index + 1}
            width={fitSize?.width}
            height={allPages ? undefined : fitSize?.height}
            loading={loading}
          />
        ))}
      </Document>
    );
  },
  (a, b) =>
    a.debouncedInstance.blob === b.debouncedInstance.blob &&
    a.fitSize?.width === b.fitSize?.width && a.allPages === b.allPages,
);

export function PDFViewer({
  children,
  className,
  allPages = false,
  ...props
}: {
  children: React.ReactElement<DocumentProps>;
  allPages?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({
    width: undefined,
    height: undefined,
  });
  const fitSize = useMemo(
    () =>
      allPages && size.width
        ? { width: size.width, height: size.width * Math.SQRT2 }
        : size.height && size.width
        ? size.height / size.width > Math.SQRT2
          ? { width: size.width, height: size.width * Math.SQRT2 }
          : { width: size.height * Math.SQRT1_2, height: size.height }
        : undefined,
    [allPages, size],
  );

  const onResize = useDebouncedCallback(setSize, 200);

  useResizeObserver({
    ref: containerRef as RefObject<HTMLElement>,
    onResize,
  });

  const [instance] = usePDF({ document: children });

  const [debouncedInstance, setDebouncedInstance] = useState(instance);
  const isLoadingRef = useRef(false);
  const isLatest = instance.blob === debouncedInstance.blob;
  const instanceRef = useRef(instance);
  instanceRef.current = instance;

  useEffect(() => {
    if (isLatest || isLoadingRef.current) return;
    setDebouncedInstance(instanceRef.current);
  }, [isLatest]);

  return (
    <div
      ref={containerRef}
      className={cn('relative flex', allPages ? 'overflow-visible' : 'overflow-hidden', className)}
      {...props}
    >
      {debouncedInstance.blob && (
        <MemoizedPDFViewer
          debouncedInstance={debouncedInstance}
          fitSize={fitSize}
          setDebouncedInstance={setDebouncedInstance}
          instanceRef={instanceRef}
          isLoadingRef={isLoadingRef}
          allPages={allPages}
        />
      )}
    </div>
  );
}
