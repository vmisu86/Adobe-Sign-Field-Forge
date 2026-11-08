import { inject, Injectable, signal } from '@angular/core';
import { Field } from '../models/field.model';
import {
  AddFieldCommand,
  DeleteFieldCommand,
  HistoryService,
  MoveFieldCommand,
  ReplaceFieldsCommand,
  ResizeFieldCommand,
  UpdateFieldCommand,
} from './history.service';

/**
 * Owns the list of fields. Every mutation replaces the list (and the changed field) instead of
 * editing in place, and goes through HistoryService unless `useHistory` is false.
 */
@Injectable({
  providedIn: 'root',
})
export class PdfFieldService {
  private readonly historyService = inject(HistoryService);

  private readonly fieldsState = signal<Field[]>([]);
  readonly fields = this.fieldsState.asReadonly();

  getFields(): Field[] {
    return this.fieldsState();
  }

  addField(field: Field, useHistory = true): void {
    if (useHistory) {
      this.historyService.executeCommand(
        new AddFieldCommand(
          field,
          (f) => this.addFieldInternal(f),
          (id) => this.deleteFieldInternal(id),
        ),
      );
    } else {
      this.addFieldInternal(field);
    }
  }

  updateField(id: string, updates: Partial<Field>, useHistory = true): void {
    const oldField = this.fieldsState().find((f) => f.id === id);
    if (!oldField) return;

    const newField = { ...oldField, ...updates };

    if (useHistory) {
      this.historyService.executeCommand(
        new UpdateFieldCommand(oldField, newField, (f) => this.updateFieldInternal(f)),
      );
    } else {
      this.updateFieldInternal(newField);
    }
  }

  deleteField(id: string, useHistory = true): void {
    const field = this.fieldsState().find((f) => f.id === id);
    if (!field) return;

    if (useHistory) {
      this.historyService.executeCommand(
        new DeleteFieldCommand(
          field,
          (fieldId) => this.deleteFieldInternal(fieldId),
          (f) => this.addFieldInternal(f),
        ),
      );
    } else {
      this.deleteFieldInternal(id);
    }
  }

  /**
   * Move a field. During a drag call this with `useHistory = false` for every frame, then once
   * at the end with `useHistory = true` and the position the drag started from.
   */
  moveField(id: string, newLeft: number, newTop: number, useHistory = true, oldLeft?: number, oldTop?: number): void {
    const field = this.fieldsState().find((f) => f.id === id);
    if (!field) return;

    if (useHistory) {
      const originalLeft = oldLeft ?? field.locations.left;
      const originalTop = oldTop ?? field.locations.top;

      if (originalLeft === newLeft && originalTop === newTop) return;

      this.historyService.executeCommand(
        new MoveFieldCommand(id, originalLeft, originalTop, newLeft, newTop, (fieldId, left, top) =>
          this.moveFieldInternal(fieldId, left, top),
        ),
      );
    } else {
      this.moveFieldInternal(id, newLeft, newTop);
    }
  }

  /** Resize a field; same calling convention as `moveField`. */
  resizeField(
    id: string,
    newLeft: number,
    newTop: number,
    newWidth: number,
    newHeight: number,
    useHistory = true,
    oldBounds?: { left: number; top: number; width: number; height: number },
  ): void {
    const field = this.fieldsState().find((f) => f.id === id);
    if (!field) return;

    if (useHistory) {
      const original = oldBounds ?? field.locations;

      if (
        original.left === newLeft &&
        original.top === newTop &&
        original.width === newWidth &&
        original.height === newHeight
      ) {
        return;
      }

      this.historyService.executeCommand(
        new ResizeFieldCommand(
          id,
          original.left,
          original.top,
          original.width,
          original.height,
          newLeft,
          newTop,
          newWidth,
          newHeight,
          (fieldId, left, top, width, height) => this.resizeFieldInternal(fieldId, left, top, width, height),
        ),
      );
    } else {
      this.resizeFieldInternal(id, newLeft, newTop, newWidth, newHeight);
    }
  }

  /** Replace every field, as one undoable step (or none with `useHistory = false`). */
  replaceFields(fields: Field[], useHistory = true): void {
    if (useHistory) {
      this.historyService.executeCommand(
        new ReplaceFieldsCommand(this.fieldsState(), fields, (next) => this.fieldsState.set(next)),
      );
    } else {
      this.fieldsState.set(fields);
    }
  }

  private addFieldInternal(field: Field): void {
    this.fieldsState.update((fields) => [...fields, field]);
  }

  private updateFieldInternal(field: Field): void {
    this.fieldsState.update((fields) => fields.map((f) => (f.id === field.id ? field : f)));
  }

  private deleteFieldInternal(id: string): void {
    this.fieldsState.update((fields) => fields.filter((field) => field.id !== id));
  }

  private moveFieldInternal(id: string, left: number, top: number): void {
    this.fieldsState.update((fields) =>
      fields.map((field) => (field.id === id ? { ...field, locations: { ...field.locations, left, top } } : field)),
    );
  }

  private resizeFieldInternal(id: string, left: number, top: number, width: number, height: number): void {
    this.fieldsState.update((fields) =>
      fields.map((field) =>
        field.id === id ? { ...field, locations: { ...field.locations, left, top, width, height } } : field,
      ),
    );
  }
}
