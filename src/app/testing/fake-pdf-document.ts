import { signal } from '@angular/core';
import { PdfDocument, PdfViewport } from '../models/pdf.types';
import { makeViewport, PAGE_HEIGHT_POINTS } from './test-data';

/**
 * Stand-in for PdfDocumentService with a fixed viewport, so editor logic can be tested without
 * rendering a PDF. Provide it with `{ provide: PdfDocumentService, useValue: createFakePdf() }`.
 */
export function createFakePdf(pageHeights: Record<number, number> = {}) {
  return {
    document: signal<PdfDocument | null>(null),
    totalPages: signal(3),
    currentPage: signal(1),
    viewport: signal<PdfViewport | null>(makeViewport() as unknown as PdfViewport),
    setPage(page: number) {
      this.currentPage.set(page);
    },
    getPageHeightPoints: (page: number) => Promise.resolve(pageHeights[page] ?? PAGE_HEIGHT_POINTS),
  };
}
