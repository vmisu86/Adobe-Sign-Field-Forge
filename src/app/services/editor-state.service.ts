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

  /**
   * The tool. '' is the Select tool: clicks select and move fields and never create one. Otherwise the
   * key of the field type preset that dragging (or clicking) on empty canvas will create.
   */
  readonly selectedTypeKey = signal('');
  readonly selectedType = computed(() => this.fieldTypes.getFieldTypeByKey(this.selectedTypeKey()));
  /** Drawing a field type (as opposed to the Select tool). */
  readonly armed = computed(() => this.selectedType() !== undefined);
  /** Stay on the drawing tool after a field is placed, for placing several in a row. */
  readonly keepDrawing = signal(false);

  readonly selectedFieldId = signal<string | null>(null);
  /** Always the current version of the selected field, so the panel and the handles never go stale. */
  readonly selectedField = computed<Field | null>(() => {
    const id = this.selectedFieldId();
    return id === null ? null : (this.fieldService.fields().find((field) => field.id === id) ?? null);
  });
  readonly hoveredFieldId = signal<string | null>(null);

  /** A field the user asked to see (from the list): the viewer scrolls to it once its page is drawn. */
  readonly revealRequest = signal<string | null>(null);

  /** Bumped when a document-type change is cancelled, so the toolbar select snaps back to the real value. */
  readonly documentTypeResync = signal(0);

  readonly drawing = signal<DrawingGesture | null>(null);
  /** Where the mouse is over the page, in canvas pixels; null when it is elsewhere. */
  readonly pointer = signal<Point | null>(null);
  readonly cursor = signal('default');
}
