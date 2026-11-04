import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { cn } from "@/lib/utils";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfInlineViewerProps {
  blob: Blob;
  className?: string;
}

export function PdfInlineViewer({ blob, className }: PdfInlineViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return (
      <div className={cn("h-full w-full flex items-center justify-center p-8 text-center", className)}>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className={cn("h-full w-full overflow-auto", className)}>
      <Document
        file={blob}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={(err) => setError(err?.message || "Unable to render PDF preview.")}
        loading={<div className="p-6 text-sm text-muted-foreground">Loading preview…</div>}
        className="w-full"
      >
        <div className="flex flex-col items-center gap-4 p-4">
          {Array.from({ length: numPages }, (_, idx) => (
            <div key={idx} className="shadow-sm border border-border rounded-md overflow-hidden bg-background">
              <Page
                pageNumber={idx + 1}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                width={860}
              />
            </div>
          ))}
        </div>
      </Document>
    </div>
  );
}
