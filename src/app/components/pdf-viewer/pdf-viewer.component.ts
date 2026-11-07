import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  HostListener,
  inject,
  untracked,
  viewChild,
} from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CanvasRendererService } from '../../services/canvas-renderer.service';
import { CoordinateConversionService } from '../../services/coordinate-conversion.service';
import { EditorStateService } from '../../services/editor-state.service';
import { FieldEditorService } from '../../services/field-editor.service';
import { FieldTypeService } from '../../services/field-type.service';
import { FileActionsService } from '../../services/file-actions.service';
import { PdfDocumentService } from '../../services/pdf-document.service';
import { PdfFieldService } from '../../services/pdf-field.service';
import { PAGE_GUTTER, sizeCanvas } from '../../utils/zoom';
import { FieldPropertiesSidebarComponent } from '../field-properties-sidebar/field-properties-sidebar.component';
import { FieldTypeSidebarComponent } from '../field-type-sidebar/field-type-sidebar.component';
import { StatusBarComponent } from '../status-bar/status-bar.component';
import { ToolbarComponent } from '../toolbar/toolbar.component';

/** Wheel and pinch events arrive in bursts; one zoom step per this many milliseconds is enough. */
const WHEEL_ZOOM_INTERVAL_MS = 120;

/** Space to leave above a field when scrolling to it, so it is not flush with the edge. */
const REVEAL_MARGIN_PX = 96;

/**
 * The page layout and the two canvases: one with the PDF page, one on top of it with the fields.
 * What the mouse does is decided by FieldEditorService; this component only turns DOM events into
 * canvas coordinates, paints the state it finds, and keeps the page fitted to the window.
 */
@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NzButtonModule,
    NzIconModule,
    ToolbarComponent,
    FieldTypeSidebarComponent,
    FieldPropertiesSidebarComponent,
    StatusBarComponent,
  ],
  templateUrl: './pdf-viewer.component.html',
})
export class PdfViewerComponent {
  protected readonly state = inject(EditorStateService);
  protected readonly pdf = inject(PdfDocumentService);
  protected readonly actions = inject(FileActionsService);
  private readonly editor = inject(FieldEditorService);
  private readonly fields = inject(PdfFieldService);
  private readonly renderer = inject(CanvasRendererService);
  private readonly coords = inject(CoordinateConversionService);
  private readonly fieldTypes = inject(FieldTypeService);
  private readonly message = inject(NzMessageService);

  private readonly workspace = viewChild<ElementRef<HTMLElement>>('workspace');
  private readonly pdfCanvas = viewChild<ElementRef<HTMLCanvasElement>>('pdfCanvas');
  private readonly overlayCanvas = viewChild<ElementRef<HTMLCanvasElement>>('drawingCanvas');

  private pendingFrame = 0;
  private lastWheelZoom = 0;

  constructor() {
    // Keep the page fitted to the workspace: tell the document service how wide the workspace is.
    effect((onCleanup) => {
      const element = this.workspace()?.nativeElement;
      if (!element) return;
      const observer = new ResizeObserver(() => this.pdf.setAvailableWidth(element.clientWidth - PAGE_GUTTER));
      observer.observe(element);
      onCleanup(() => observer.disconnect());
    });

    // Draw the PDF page whenever the document, the page, the zoom or the canvas element changes.
    effect(() => {
      const canvas = this.pdfCanvas()?.nativeElement;
      const page = this.pdf.currentPage();
      this.pdf.scaleInput();
      if (canvas && this.pdf.document()) {
        untracked(() => void this.renderPage(canvas, page));
      }
    });

    // Repaint the overlay whenever anything it shows changes. Several changes in one frame
    // (a mouse move touches the field and the hover state) are painted once.
    effect(() => {
      this.overlayCanvas();
      this.pdf.viewport();
      this.pdf.currentPage();
      this.fields.fields();
      this.state.selectedFieldId();
      this.state.hoveredFieldId();
      this.state.showGrid();
      this.state.documentType();
      this.state.drawing();
      this.state.selectedTypeKey();
      // The placement preview follows the mouse, so only then is the pointer worth repainting for.
      if (this.state.armed() && !this.state.drawing()) {
        this.state.pointer();
      }
      this.scheduleOverlayPaint();
    });

    // A field picked in the list: once its page is on screen, scroll it into view.
    effect(() => {
      const id = this.state.revealRequest();
      const viewport = this.pdf.viewport();
      const rendered = this.pdf.renderedPage();
      const field = id === null ? undefined : this.fields.fields().find((f) => f.id === id);
      if (!field || !viewport || field.locations.pageNumber !== rendered) return;
      untracked(() => {
        this.scrollToField(field.locations.top);
        this.state.revealRequest.set(null);
      });
    });

    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(this.pendingFrame));
  }

  // ------------------------------------------------------------------ mouse

  protected onMouseDown(event: MouseEvent): void {
    this.editor.pointerDown(this.canvasPoint(event));
  }

  protected onMouseMove(event: MouseEvent): void {
    this.editor.pointerMove(this.canvasPoint(event));
  }

  protected onMouseLeave(): void {
    this.editor.pointerLeave();
  }

  /** Listening on the window means a drag that ends outside the canvas still ends. */
  @HostListener('window:mouseup', ['$event'])
  protected onMouseUp(event: MouseEvent): void {
    if (!this.overlayCanvas()) return;
    const point = this.canvasPoint(event);
    this.editor.pointerUp(point);
    this.editor.pointerMove(point); // refresh hover and cursor for the new position
  }

  /** Ctrl (or Cmd) + wheel, which is also how a trackpad pinch arrives, zooms the page. */
  protected onWheel(event: WheelEvent): void {
    if (!(event.ctrlKey || event.metaKey) || !this.pdf.document()) return;
    event.preventDefault();

    const now = performance.now();
    if (now - this.lastWheelZoom < WHEEL_ZOOM_INTERVAL_MS) return;
    this.lastWheelZoom = now;

    if (event.deltaY < 0) {
      this.pdf.zoomIn();
    } else if (event.deltaY > 0) {
      this.pdf.zoomOut();
    }
  }

  protected setKeepDrawing(event: Event): void {
    this.state.keepDrawing.set((event.target as HTMLInputElement).checked);
  }

  protected stopDrawing(): void {
    this.editor.selectTool();
  }

  // --------------------------------------------------------------- keyboard

  @HostListener('window:keydown', ['$event'])
  protected onKeyDown(event: KeyboardEvent): void {
    if (isTypingTarget(event.target)) return;

    const modifier = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();

    if (modifier && key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.editor.undo();
    } else if (modifier && ((key === 'z' && event.shiftKey) || key === 'y')) {
      event.preventDefault();
      this.editor.redo();
    } else if (key === 'delete' || key === 'backspace') {
      if (this.state.selectedField() && !this.state.drawing()) {
        event.preventDefault();
        this.editor.deleteSelected();
      }
    } else if (key === 'escape') {
      this.editor.escape();
    } else if (!modifier && !event.altKey) {
      this.onPlainKey(event, key);
    }
  }

  /** Single-key shortcuts: tools (V, T, S, ...) and zoom (+, -, 0). */
  private onPlainKey(event: KeyboardEvent, key: string): void {
    if (key === 'v') {
      this.editor.selectTool();
    } else if (key === '+' || key === '=') {
      this.pdf.zoomIn();
    } else if (key === '-') {
      this.pdf.zoomOut();
    } else if (key === '0') {
      this.pdf.fitWidth();
    } else if (key.length === 1 && this.pdf.document() && this.editor.armByShortcut(key)) {
      event.preventDefault();
    }
  }

  // ------------------------------------------------------------- rendering

  private async renderPage(canvas: HTMLCanvasElement, page: number): Promise<void> {
    try {
      const viewport = await this.pdf.render(page, canvas);
      const overlay = this.overlayCanvas()?.nativeElement;
      if (viewport && overlay) {
        sizeCanvas(overlay, viewport.width, viewport.height, canvas.width / viewport.width);
      }
    } catch (error) {
      console.error('Error rendering page', error);
      this.message.error('That page could not be drawn.');
    }
  }

  private scheduleOverlayPaint(): void {
    if (this.pendingFrame) return;
    this.pendingFrame = requestAnimationFrame(() => {
      this.pendingFrame = 0;
      this.paintOverlay();
    });
  }

  private paintOverlay(): void {
    const canvas = this.overlayCanvas()?.nativeElement;
    const ctx = canvas?.getContext('2d');
    const viewport = this.pdf.viewport();
    if (!canvas || !ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.renderer.clearCanvas(canvas);
    if (!viewport) return;

    // Everything below is drawn in CSS pixels; the backing store is denser on high-DPI screens.
    const pixelRatio = canvas.width / viewport.width;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const documentType = this.state.documentType();
    if (this.state.showGrid()) {
      this.renderer.drawGrid(ctx, viewport, documentType);
    }

    const page = this.pdf.currentPage();
    const selectedId = this.state.selectedFieldId();
    const hoveredId = this.state.hoveredFieldId();
    for (const field of this.fields.fields()) {
      if (field.locations.pageNumber !== page) continue;
      this.renderer.drawField(
        ctx,
        field,
        viewport,
        documentType,
        this.fieldTypes.getFieldKind(field),
        {
          selected: field.id === selectedId,
          hovered: field.id === hoveredId,
          dimmed: selectedId !== null && field.id !== selectedId,
        },
        // Every field is the signer's today; naming it on each box is noise.
        field.recipientIndex === 1 ? '' : this.fieldTypes.getRecipientLabel(field.recipientIndex),
      );
    }

    const drawing = this.state.drawing();
    if (drawing) {
      this.renderer.drawFieldPreview(
        ctx,
        drawing.start.x,
        drawing.start.y,
        drawing.current.x,
        drawing.current.y,
        viewport,
        documentType,
      );
      return;
    }

    // With a field type armed, show where a click would put one.
    const armedType = this.state.selectedType();
    const pointer = this.state.pointer();
    if (armedType && pointer) {
      const box = this.coords.boxFromClick(
        pointer,
        this.fieldTypes.getDefaultSize(armedType.inputType),
        viewport,
        documentType,
      );
      this.renderer.drawPlacementGhost(ctx, box, viewport, documentType, armedType.kind);
    }
  }

  /** Scroll the workspace so a field with this stored `top` is in view, if it is not already. */
  private scrollToField(top: number): void {
    const workspace = this.workspace()?.nativeElement;
    const overlay = this.overlayCanvas()?.nativeElement;
    const viewport = this.pdf.viewport();
    if (!workspace || !overlay || !viewport) return;

    const canvasY = this.coords.getCanvasPosition(top, viewport, this.state.documentType());
    const overlayTop =
      overlay.getBoundingClientRect().top - workspace.getBoundingClientRect().top + workspace.scrollTop;
    const fieldY = overlayTop + canvasY;

    const visibleFrom = workspace.scrollTop;
    const visibleTo = workspace.scrollTop + workspace.clientHeight - REVEAL_MARGIN_PX;
    if (fieldY < visibleFrom + REVEAL_MARGIN_PX / 2 || fieldY > visibleTo) {
      workspace.scrollTo({ top: Math.max(0, fieldY - REVEAL_MARGIN_PX), behavior: 'smooth' });
    }
  }

  private canvasPoint(event: MouseEvent) {
    const canvas = this.overlayCanvas()?.nativeElement;
    return canvas ? this.coords.getCanvasCoordinates(event, canvas) : { x: 0, y: 0 };
  }
}

/** Keys typed into a form control or a dialog belong to it, not to the canvas. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
    target.closest('.cdk-overlay-container') !== null
  );
}
