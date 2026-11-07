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
import { FieldPropertiesSidebarComponent } from '../field-properties-sidebar/field-properties-sidebar.component';
import { FieldTypeSidebarComponent } from '../field-type-sidebar/field-type-sidebar.component';
import { ToolbarComponent } from '../toolbar/toolbar.component';

/**
 * The page layout and the two canvases: one with the PDF page, one on top of it with the fields.
 * What the mouse does is decided by FieldEditorService; this component only turns DOM events into
 * canvas coordinates and paints the state it finds.
 */
@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzButtonModule, NzIconModule, ToolbarComponent, FieldTypeSidebarComponent, FieldPropertiesSidebarComponent],
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

  private readonly pdfCanvas = viewChild<ElementRef<HTMLCanvasElement>>('pdfCanvas');
  private readonly overlayCanvas = viewChild<ElementRef<HTMLCanvasElement>>('drawingCanvas');

  private pendingFrame = 0;

  constructor() {
    // Draw the PDF page whenever the document, the page or the canvas element changes.
    effect(() => {
      const canvas = this.pdfCanvas()?.nativeElement;
      const page = this.pdf.currentPage();
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
      this.scheduleOverlayPaint();
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

  /** Listening on the window means a drag that ends outside the canvas still ends. */
  @HostListener('window:mouseup', ['$event'])
  protected onMouseUp(event: MouseEvent): void {
    if (!this.overlayCanvas()) return;
    const point = this.canvasPoint(event);
    this.editor.pointerUp(point);
    this.editor.pointerMove(point); // refresh hover and cursor for the new position
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
      if (!this.editor.cancelGesture()) {
        this.editor.select(null);
      }
    }
  }

  // ------------------------------------------------------------- rendering

  private async renderPage(canvas: HTMLCanvasElement, page: number): Promise<void> {
    try {
      const viewport = await this.pdf.render(page, canvas);
      const overlay = this.overlayCanvas()?.nativeElement;
      if (viewport && overlay) {
        overlay.width = viewport.width;
        overlay.height = viewport.height;
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
    if (!canvas || !ctx) return;

    this.renderer.clearCanvas(canvas);

    const viewport = this.pdf.viewport();
    if (!viewport) return;

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
