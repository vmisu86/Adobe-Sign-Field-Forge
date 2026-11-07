import { Injectable, signal } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import { PdfDocument, PdfRenderTask, PdfViewport } from '../models/pdf.types';

/** Zoom used for every page. Fields are stored in PDF points, so this only affects pixels. */
export const RENDER_SCALE = 1.5;

/**
 * Loads a PDF with PDF.js and renders one page at a time. Rendering is cancellable: asking for a
 * page while another is still being drawn cancels the first, and only the newest request wins.
 */
@Injectable({
  providedIn: 'root',
})
export class PdfDocumentService {
  private readonly documentState = signal<PdfDocument | null>(null);
  private readonly totalPagesState = signal(0);
  private readonly currentPageState = signal(1);
  private readonly viewportState = signal<PdfViewport | null>(null);

  readonly document = this.documentState.asReadonly();
  readonly totalPages = this.totalPagesState.asReadonly();
  readonly currentPage = this.currentPageState.asReadonly();
  /** Viewport of the page that is on screen right now; null until the first render finishes. */
  readonly viewport = this.viewportState.asReadonly();

  private renderTask: PdfRenderTask | null = null;
  private renderSequence = 0;
  private pageHeights = new Map<number, number>();

  constructor() {
    // Served from our own assets (copied by angular.json) so the document never needs a CDN.
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('assets/pdfjs/pdf.worker.min.mjs', document.baseURI).href;
  }

  async load(data: ArrayBuffer): Promise<void> {
    const loaded = await pdfjsLib.getDocument({ data }).promise;

    const previous = this.documentState();
    this.cancelRender();
    this.pageHeights = new Map();
    this.viewportState.set(null);
    this.documentState.set(loaded);
    this.totalPagesState.set(loaded.numPages);
    this.currentPageState.set(1);

    await previous?.destroy();
  }

  setPage(page: number): void {
    const total = this.totalPagesState();
    if (total === 0) return;
    this.currentPageState.set(Math.min(Math.max(1, Math.trunc(page)), total));
  }

  /**
   * Draw `pageNumber` into `canvas` and resize it to fit. Resolves with the viewport, or null if
   * a newer request superseded this one.
   */
  async render(pageNumber: number, canvas: HTMLCanvasElement): Promise<PdfViewport | null> {
    const pdf = this.documentState();
    if (!pdf) return null;

    const sequence = ++this.renderSequence;
    this.cancelRender();

    const page = await pdf.getPage(pageNumber);
    if (sequence !== this.renderSequence) return null;

    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const context = canvas.getContext('2d');
    if (!context) return null;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const task = page.render({ canvasContext: context, viewport });
    this.renderTask = task;
    try {
      await task.promise;
    } catch (error) {
      if (error instanceof pdfjsLib.RenderingCancelledException) return null;
      throw error;
    } finally {
      if (this.renderTask === task) this.renderTask = null;
    }

    if (sequence !== this.renderSequence) return null;
    this.viewportState.set(viewport);
    return viewport;
  }

  /** Height of a page in PDF points (needed to flip Y between document types). */
  async getPageHeightPoints(pageNumber: number): Promise<number> {
    const cached = this.pageHeights.get(pageNumber);
    if (cached !== undefined) return cached;

    const pdf = this.documentState();
    if (!pdf) throw new Error('No PDF is loaded.');

    const page = await pdf.getPage(pageNumber);
    const { viewBox } = page.getViewport({ scale: 1 });
    const height = viewBox[3] - viewBox[1];
    this.pageHeights.set(pageNumber, height);
    return height;
  }

  private cancelRender(): void {
    this.renderTask?.cancel();
    this.renderTask = null;
  }
}
