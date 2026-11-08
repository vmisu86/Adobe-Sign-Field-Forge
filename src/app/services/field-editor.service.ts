import { inject, Injectable } from '@angular/core';
import { AdobeDocumentType, Field, FormFieldContentType, Point } from '../models/field.model';
import { createFieldId } from '../utils/field-io';
import { CanvasRendererService } from './canvas-renderer.service';
import { CoordinateConversionService } from './coordinate-conversion.service';
import { EditorStateService } from './editor-state.service';
import { FieldInteractionService } from './field-interaction.service';
import { FieldTypeService } from './field-type.service';
import { HistoryService } from './history.service';
import { PdfDocumentService } from './pdf-document.service';
import { PdfFieldService } from './pdf-field.service';

/** A press-and-release that moves less than this (canvas pixels, both axes) counts as a click. */
const CLICK_TOLERANCE_PX = 4;

/**
 * The editor's behaviour, without any DOM: what a mouse press, move or release on the canvas
 * means (select, move, resize, draw), and the commands around it (undo, delete, change document
 * type). The canvas component forwards events here and draws whatever state results.
 */
@Injectable({
  providedIn: 'root',
})
export class FieldEditorService {
  private readonly fields = inject(PdfFieldService);
  private readonly pdf = inject(PdfDocumentService);
  private readonly state = inject(EditorStateService);
  private readonly interaction = inject(FieldInteractionService);
  private readonly renderer = inject(CanvasRendererService);
  private readonly coords = inject(CoordinateConversionService);
  private readonly fieldTypes = inject(FieldTypeService);
  private readonly history = inject(HistoryService);

  // ---------------------------------------------------------------- pointer

  pointerDown(point: Point): void {
    const viewport = this.pdf.viewport();
    if (!viewport) return;

    const selected = this.state.selectedField();
    if (selected) {
      const handle = this.interaction.getResizeHandleAtPoint(
        point.x,
        point.y,
        selected,
        viewport,
        this.state.documentType(),
      );
      if (handle) {
        this.interaction.startResize(selected, handle, point.x, point.y);
        return;
      }
    }

    const hit = this.fieldAt(point);
    if (hit) {
      this.state.selectedFieldId.set(hit.id);
      this.interaction.startDrag(hit, point.x, point.y);
      return;
    }

    this.state.selectedFieldId.set(null);
    if (this.state.selectedType()) {
      this.state.drawing.set({ start: point, current: point });
    }
  }

  pointerMove(point: Point): void {
    const viewport = this.pdf.viewport();
    if (!viewport) return;

    this.state.pointer.set(point);

    const gesture = this.interaction.getState();
    const selected = this.state.selectedField();
    const documentType = this.state.documentType();
    const snap = this.state.snapToGrid();
    const gridSize = this.state.gridSize;

    if (gesture.isDragging && selected) {
      const next = this.interaction.calculateDragPosition(point.x, point.y, viewport, documentType, snap, gridSize);
      if (next) this.fields.moveField(selected.id, next.left, next.top, false);
      return;
    }

    if (gesture.isResizing && selected) {
      const next = this.interaction.calculateResizeBounds(point.x, point.y, viewport, documentType, snap, gridSize);
      if (next) this.fields.resizeField(selected.id, next.left, next.top, next.width, next.height, false);
      return;
    }

    const drawing = this.state.drawing();
    if (drawing) {
      this.state.drawing.set({ ...drawing, current: point });
      return;
    }

    const hovered = this.fieldAt(point);
    const hoveredId = hovered?.id ?? null;
    if (hoveredId !== this.state.hoveredFieldId()) {
      this.state.hoveredFieldId.set(hoveredId);
    }
    this.state.cursor.set(this.interaction.getCursorStyle(point.x, point.y, selected, hovered, viewport, documentType));
  }

  pointerUp(point: Point): void {
    const gesture = this.interaction.getState();
    const selected = this.state.selectedField();

    if (gesture.isDragging && selected) {
      const result = this.interaction.completeDrag();
      if (result) {
        const current = this.state.selectedField() ?? selected;
        this.fields.moveField(
          current.id,
          current.locations.left,
          current.locations.top,
          true,
          result.startPos.left,
          result.startPos.top,
        );
      }
      return;
    }

    if (gesture.isResizing && selected) {
      const result = this.interaction.completeResize();
      if (result) {
        const current = (this.state.selectedField() ?? selected).locations;
        this.fields.resizeField(
          selected.id,
          current.left,
          current.top,
          current.width,
          current.height,
          true,
          result.startBounds,
        );
      }
      return;
    }

    const drawing = this.state.drawing();
    if (drawing) {
      this.state.drawing.set(null);
      this.createField(drawing.start, point);
    }
  }

  /** The mouse left the page: forget where it was (the placement preview and the status bar follow it). */
  pointerLeave(): void {
    this.state.pointer.set(null);
    this.state.hoveredFieldId.set(null);
  }

  /**
   * Abandon whatever the pointer is doing and put the field back where it was.
   * Returns true if there was something to abandon.
   */
  cancelGesture(): boolean {
    const gesture = this.interaction.getState();
    const selected = this.state.selectedField();
    let cancelled = false;

    if (gesture.isDragging && selected && gesture.dragFieldStartPos) {
      this.fields.moveField(selected.id, gesture.dragFieldStartPos.left, gesture.dragFieldStartPos.top, false);
      cancelled = true;
    }
    if (gesture.isResizing && selected && gesture.resizeStartBounds) {
      const b = gesture.resizeStartBounds;
      this.fields.resizeField(selected.id, b.left, b.top, b.width, b.height, false);
      cancelled = true;
    }
    if (this.state.drawing()) {
      this.state.drawing.set(null);
      cancelled = true;
    }

    this.interaction.cancelOperation();
    return cancelled;
  }

  // --------------------------------------------------------------- commands

  /** Switch to the Select tool: clicks select and move fields, and nothing is created. */
  selectTool(): void {
    this.state.selectedTypeKey.set('');
    this.state.drawing.set(null);
  }

  /** Arm a field type to draw. Choosing the armed type again goes back to the Select tool. */
  armType(key: string): void {
    if (this.state.selectedTypeKey() === key) {
      this.selectTool();
      return;
    }
    this.state.selectedTypeKey.set(key);
    this.state.selectedFieldId.set(null);
  }

  /** Arm the field type that `key` stands for. Returns false when no type uses that key. */
  armByShortcut(key: string): boolean {
    const preset = this.fieldTypes.getFieldTypeByShortcut(key);
    if (!preset) return false;
    this.state.selectedTypeKey.set(this.fieldTypes.keyOf(preset));
    this.state.selectedFieldId.set(null);
    return true;
  }

  /** Escape backs out one level: a running drag or resize, then the drawing tool, then the selection. */
  escape(): void {
    if (this.cancelGesture()) return;
    if (this.state.armed()) {
      this.selectTool();
      return;
    }
    this.state.selectedFieldId.set(null);
  }

  select(id: string | null): void {
    this.state.selectedFieldId.set(id);
  }

  /** Select a field wherever it is: go to its page and ask the viewer to scroll it into view. */
  focusField(id: string): void {
    const field = this.fields.getFields().find((f) => f.id === id);
    if (!field) return;
    this.selectTool();
    if (field.locations.pageNumber !== this.pdf.currentPage()) {
      this.pdf.setPage(field.locations.pageNumber);
    }
    this.state.selectedFieldId.set(id);
    this.state.revealRequest.set(id);
  }

  deleteField(id: string): void {
    this.fields.deleteField(id);
    if (this.state.selectedFieldId() === id) {
      this.state.selectedFieldId.set(null);
    }
  }

  deleteSelected(): void {
    const selected = this.state.selectedField();
    if (selected) this.deleteField(selected.id);
  }

  updateSelected(updates: Partial<Field>): void {
    const selected = this.state.selectedField();
    if (selected) this.fields.updateField(selected.id, updates);
  }

  undo(): void {
    this.history.undo();
  }

  redo(): void {
    this.history.redo();
  }

  /**
   * Switch the coordinate system and rewrite every field's `top` so it stays at the same place on
   * the page. The undo history is dropped because older steps hold values in the old system.
   * Throws if fields exist but their page sizes cannot be read (no PDF loaded).
   */
  async applyDocumentType(type: AdobeDocumentType): Promise<void> {
    if (type === this.state.documentType()) return;

    const current = this.fields.getFields();
    if (current.length > 0) {
      const heights = new Map<number, number>();
      for (const page of new Set(current.map((field) => field.locations.pageNumber))) {
        heights.set(page, await this.pdf.getPageHeightPoints(page));
      }
      this.fields.replaceFields(
        current.map((field) => ({
          ...field,
          locations: {
            ...field.locations,
            top: this.coords.flipTop(field.locations.top, heights.get(field.locations.pageNumber) ?? 0),
          },
        })),
        false,
      );
      this.history.clear();
    }

    this.state.documentType.set(type);
  }

  // ---------------------------------------------------------------- helpers

  private fieldAt(point: Point): Field | null {
    const viewport = this.pdf.viewport();
    if (!viewport) return null;

    const page = this.pdf.currentPage();
    const documentType = this.state.documentType();
    const candidates = this.fields.fields().filter((field) => field.locations.pageNumber === page);

    // Last drawn is on top, so it wins.
    for (let i = candidates.length - 1; i >= 0; i--) {
      if (this.renderer.isPointInField(point.x, point.y, candidates[i], viewport, documentType)) {
        return candidates[i];
      }
    }
    return null;
  }

  private createField(start: Point, end: Point): void {
    const viewport = this.pdf.viewport();
    const type = this.state.selectedType();
    if (!viewport || !type) return;

    const documentType = this.state.documentType();
    const scale = viewport.scale;
    const isClick = Math.abs(end.x - start.x) < CLICK_TOLERANCE_PX && Math.abs(end.y - start.y) < CLICK_TOLERANCE_PX;

    let left: number;
    let top: number;
    let width: number;
    let height: number;

    if (isClick) {
      // A bare click would otherwise leave an invisible 0 x 0 field that cannot be selected.
      ({ left, top, width, height } = this.coords.boxFromClick(
        start,
        this.fieldTypes.getDefaultSize(type.inputType),
        viewport,
        documentType,
      ));
    } else {
      left = this.coords.pixelsToPoints(Math.min(start.x, end.x), scale);
      width = this.coords.pixelsToPoints(Math.abs(end.x - start.x), scale);
      height = this.coords.pixelsToPoints(Math.abs(end.y - start.y), scale);
      top = this.coords.convertYCoordinate(Math.min(start.y, end.y), viewport, documentType);
    }

    [left, top, width, height] = [left, top, width, height].map((value) => this.coords.roundPoints(value));

    const contentType = type.contentType ?? FormFieldContentType.DATA;
    const field: Field = {
      id: createFieldId(),
      name: this.fieldTypes.generateSmartFieldName(type.inputType, contentType, this.fields.getFields()),
      inputType: type.inputType,
      contentType,
      readOnly: type.readOnly,
      required: false,
      validation: type.validation,
      validationData: type.validationData,
      locations: { pageNumber: this.pdf.currentPage(), left, top, width, height },
      recipientIndex: this.state.recipientIndex(),
    };

    this.fields.addField(field);

    // The new field is selected so it can be named straight away, and the tool goes back to Select
    // unless the user asked to keep drawing.
    this.state.selectedFieldId.set(field.id);
    if (!this.state.keepDrawing()) {
      this.state.selectedTypeKey.set('');
    }
  }
}
