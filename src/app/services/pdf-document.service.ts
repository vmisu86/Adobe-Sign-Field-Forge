import { computed, Injectable, signal } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import { PdfDocument, PdfRenderTask, PdfViewport } from '../models/pdf.types';
import { fitWidthScale, nextZoomStep, sizeCanvas, ZoomMode } from '../utils/zoom';

/**
 * Loads a PDF with PDF.js and renders one page at a time. Rendering is cancellable: asking for a
 * page while another is still being drawn cancels the first, and only the newest request wins.
 *
 * Fields are stored in PDF points, so zooming only changes how many pixels a point takes.
 */
@Injectable({
  providedIn: 'root',
})
export class PdfDocumentService {
  private readonly documentState = signal<PdfDocument | null>(null);
  private readonly totalPagesState = signal(0);
  private readonly currentPageState = signal(1);
  private readonly viewportState = signal<PdfViewport | null>(null);
  private readonly renderedPageState = signal(0);

  private readonly zoomModeState = signal<ZoomMode>('fit-width');
  private readonly manualScaleState = signal(1);
  private readonly availableWidthState = signal(0);

  readonly document = this.documentState.asReadonly();
  readonly totalPages = this.totalPagesState.asReadonly();
  readonly currentPage = this.currentPageState.asReadonly();
  /** Viewport of the page that is on screen right now; null until the first render finishes. */
  readonly viewport = this.viewportState.asReadonly();
  /** Which page `viewport` belongs to (0 before the first render). It lags `currentPage` while a page is drawing. */
  readonly renderedPage = this.renderedPageState.asReadonly();

  readonly zoomMode = this.zoomModeState.asReadonly();
  /** Pixels per PDF point on screen right now (1 = 100%). */
  readonly scale = computed(() => this.viewportState()?.scale ?? this.manualScaleState());
  readonly zoomPercent = computed(() => Math.round(this.scale() * 100));
  /**
   * Changes exactly when the page has to be drawn again at another scale: the window width while
   * fitting, the chosen scale otherwise. The viewer renders when this changes.
   */
  readonly scaleInput = computed(() =>
    this.zoomModeState() === 'fit-width' ? this.availableWidthState() : this.manualScaleState(),
  );

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
    this.renderedPageState.set(0);
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

  // ------------------------------------------------------------------- zoom

  /** Follow the workspace width: the page always fills it. Called by the viewer when the workspace is resized. */
  setAvailableWidth(width: number): void {
    const rounded = Math.max(0, Math.round(width));
    if (Math.abs(rounded - this.availableWidthState()) >= 2) {
      this.availableWidthState.set(rounded);
    }
  }

  fitWidth(): void {
    this.zoomModeState.set('fit-width');
  }

  setManualScale(scale: number): void {
    this.manualScaleState.set(scale);
    this.zoomModeState.set('manual');
  }

  zoomIn(): void {
    this.setManualScale(nextZoomStep(this.scale(), 1));
  }

  zoomOut(): void {
    this.setManualScale(nextZoomStep(this.scale(), -1));
  }

  // ----------------------------------------------------------------- render

  /**
   * Draw `pageNumber` into `canvas` at the current zoom and size the canvas to fit. Resolves with the
   * viewport, or null if a newer request superseded this one.
   */
  async render(pageNumber: number, canvas: HTMLCanvasElement): Promise<PdfViewport | null> {
    const pdf = this.documentState();
    if (!pdf) return null;

    const sequence = ++this.renderSequence;
    this.cancelRender();

    const page = await pdf.getPage(pageNumber);
    if (sequence !== this.renderSequence) return null;

    const viewport = page.getViewport({ scale: this.scaleFor(page.getViewport({ scale: 1 }).width) });
    const context = canvas.getContext('2d');
    if (!context) return null;

    // Backing store at the screen's pixel ratio so text stays sharp on high-DPI displays.
    const pixelRatio = window.devicePixelRatio || 1;
    sizeCanvas(canvas, viewport.width, viewport.height, pixelRatio);

    const task = page.render({
      canvasContext: context,
      viewport,
      transform: [pixelRatio, 0, 0, pixelRatio, 0, 0],
    });
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
    this.renderedPageState.set(pageNumber);
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

  private scaleFor(pageWidthPoints: number): number {
    return this.zoomModeState() === 'fit-width'
      ? fitWidthScale(this.availableWidthState(), pageWidthPoints)
      : this.manualScaleState();
  }

  private cancelRender(): void {
    this.renderTask?.cancel();
    this.renderTask = null;
  }
}
