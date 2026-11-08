import type { PageViewport, PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

export type PdfDocument = PDFDocumentProxy;
export type PdfViewport = PageViewport;
export type PdfRenderTask = RenderTask;

/**
 * The part of a PDF.js viewport the coordinate maths depends on. Services take this instead of
 * the whole class so tests do not need a real PDF.
 */
export type ViewportGeometry = Pick<PageViewport, 'scale' | 'width' | 'height' | 'viewBox'>;
