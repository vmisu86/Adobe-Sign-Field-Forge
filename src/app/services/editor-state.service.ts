import { computed, inject, Injectable, signal } from '@angular/core';
import { AdobeDocumentType, Field, Point } from '../models/field.model';
import { FieldTypeService } from './field-type.service';
import { PdfFieldService } from './pdf-field.service';

/** A rubber-band rectangle the user is dragging out to create a field. */
export interface DrawingGesture {
  start: Point;
  current: Point;
}

/** Everything the UI state of the editor is made of, kept in one place so any component can read it. */
@Injectable({
  providedIn: 'root',
})
export class EditorStateService {
  private readonly fieldService = inject(PdfFieldService);
  private readonly fieldTypes = inject(FieldTypeService);

  readonly gridSize = 10;

  readonly documentType = signal<AdobeDocumentType>(AdobeDocumentType.TRANSIENT);
  readonly showGrid = signal(false);
  readonly snapToGrid = signal(false);
  readonly leftSidebarCollapsed = signal(false);
  readonly rightSidebarCollapsed = signal(false);
  readonly recipientIndex = signal(1);

  /** Key of the field type preset that a click on empty canvas will create ('' = none). */
  readonly selectedTypeKey = signal(this.defaultTypeKey());
  readonly selectedType = computed(() => this.fieldTypes.getFieldTypeByKey(this.selectedTypeKey()));

  readonly selectedFieldId = signal<string | null>(null);
  /** Always the current version of the selected field, so the panel and the handles never go stale. */
  readonly selectedField = computed<Field | null>(() => {
    const id = this.selectedFieldId();
    return id === null ? null : (this.fieldService.fields().find((field) => field.id === id) ?? null);
  });
  readonly hoveredFieldId = signal<string | null>(null);

  /** Bumped when a document-type change is cancelled, so the toolbar select snaps back to the real value. */
  readonly documentTypeResync = signal(0);

  readonly drawing = signal<DrawingGesture | null>(null);
  readonly cursor = signal('default');

  private defaultTypeKey(): string {
    const first = this.fieldTypes.getFieldTypeGroups()[0]?.items[0];
    return first ? this.fieldTypes.keyOf(first) : '';
  }
}
