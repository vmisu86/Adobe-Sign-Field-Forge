import { computed, signal } from '@angular/core';
import { PdfDocument, PdfViewport } from '../models/pdf.types';
import { ZoomMode } from '../utils/zoom';
import { makeViewport, PAGE_HEIGHT_POINTS } from './test-data';

/**
 * Stand-in for PdfDocumentService with a fixed viewport, so editor and component logic can be tested
 * without rendering a PDF. Provide it with `{ provide: PdfDocumentService, useValue: createFakePdf() }`.
 *
 * `document` starts as null (no PDF open); pass `{ open: true }` for the "a PDF is open" case.
 */
export function createFakePdf(pageHeights: Record<number, number> = {}, options: { open?: boolean } = {}) {
  const viewport = signal<PdfViewport | null>(makeViewport() as unknown as PdfViewport);
  const zoomMode = signal<ZoomMode>('fit-width');
  const manualScale = signal(1);

  const fake = {
    document: signal<PdfDocument | null>(options.open ? ({} as PdfDocument) : null),
    totalPages: signal(3),
    currentPage: signal(1),
    renderedPage: signal(1),
    viewport,
    zoomMode: zoomMode.asReadonly(),
    scale: computed(() => viewport()?.scale ?? manualScale()),
    zoomPercent: computed(() => Math.round((viewport()?.scale ?? manualScale()) * 100)),
    scaleInput: signal(0),

    setPage(page: number) {
      fake.currentPage.set(page);
    },
    setAvailableWidth: () => undefined,
    fitWidth: () => zoomMode.set('fit-width'),
    setManualScale: (scale: number) => {
      manualScale.set(scale);
      zoomMode.set('manual');
      // The real service re-renders the page at the new scale, which replaces the viewport.
      viewport.set(makeViewport(scale) as unknown as PdfViewport);
    },
    zoomIn: () => fake.setManualScale(1.25),
    zoomOut: () => fake.setManualScale(0.75),
    render: () => Promise.resolve<PdfViewport | null>(null),
    getPageHeightPoints: (page: number) => Promise.resolve(pageHeights[page] ?? PAGE_HEIGHT_POINTS),
  };
  return fake;
}
