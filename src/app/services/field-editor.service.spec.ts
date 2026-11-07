import { TestBed } from '@angular/core/testing';
import { AdobeDocumentType } from '../models/field.model';
import { createFakePdf } from '../testing/fake-pdf-document';
import { makeField } from '../testing/test-data';
import { EditorStateService } from './editor-state.service';
import { FieldEditorService } from './field-editor.service';
import { FieldTypeService } from './field-type.service';
import { HistoryService } from './history.service';
import { PdfDocumentService } from './pdf-document.service';
import { PdfFieldService } from './pdf-field.service';

/**
 * Geometry used below (US Letter, scale 1.5, TRANSIENT): a field at left 100, top 700, 100 x 50 pt
 * sits at canvas x 150..300, y 138..213.
 */
describe('FieldEditorService', () => {
  let editor: FieldEditorService;
  let fields: PdfFieldService;
  let state: EditorStateService;
  let history: HistoryService;
  let pdf: ReturnType<typeof createFakePdf>;

  function setup(pageHeights: Record<number, number> = {}): void {
    pdf = createFakePdf(pageHeights);
    TestBed.configureTestingModule({ providers: [{ provide: PdfDocumentService, useValue: pdf }] });
    editor = TestBed.inject(FieldEditorService);
    fields = TestBed.inject(PdfFieldService);
    state = TestBed.inject(EditorStateService);
    history = TestBed.inject(HistoryService);
  }

  describe('creating fields', () => {
    beforeEach(() => setup());

    it('draws a field by dragging, converting pixels to points', () => {
      editor.pointerDown({ x: 150, y: 150 });
      editor.pointerMove({ x: 300, y: 225 });
      expect(state.drawing()).toEqual({ start: { x: 150, y: 150 }, current: { x: 300, y: 225 } });

      editor.pointerUp({ x: 300, y: 225 });

      expect(state.drawing()).toBeNull();
      expect(fields.fields().length).toBe(1);
      const [field] = fields.fields();
      expect(field.name).toBe('text_field_1');
      expect(field.locations).toEqual({ pageNumber: 1, left: 100, top: 692, width: 100, height: 50 });
      expect(history.canUndo()).toBeTrue();
    });

    it('measures top from the page top in LIBRARY', () => {
      state.documentType.set(AdobeDocumentType.LIBRARY);
      editor.pointerDown({ x: 150, y: 150 });
      editor.pointerUp({ x: 300, y: 225 });
      expect(fields.fields()[0].locations.top).toBe(100);
    });

    it('keeps at most two decimals, so exports and the form show tidy numbers', () => {
      editor.pointerDown({ x: 151, y: 151 });
      editor.pointerUp({ x: 300, y: 224 }); // 149 x 73 px = 99.333... x 48.666... pt
      const { left, top, width, height } = fields.fields()[0].locations;
      for (const value of [left, top, width, height]) {
        expect(Math.round(value * 100) / 100).toBe(value);
      }
      expect(width).toBe(99.33);
      expect(height).toBe(48.67);
    });

    it('draws upwards and leftwards from the start point too', () => {
      editor.pointerDown({ x: 300, y: 225 });
      editor.pointerUp({ x: 150, y: 150 });
      expect(fields.fields()[0].locations).toEqual({ pageNumber: 1, left: 100, top: 692, width: 100, height: 50 });
    });

    it('gives a plain click a default size instead of an invisible 0 x 0 field', () => {
      editor.pointerDown({ x: 150, y: 150 });
      editor.pointerUp({ x: 151, y: 150 });
      expect(fields.fields()[0].locations).toEqual({ pageNumber: 1, left: 100, top: 692, width: 150, height: 24 });
    });

    it('keeps a click-created field on the page', () => {
      editor.pointerDown({ x: 900, y: 1180 }); // 600pt across, 12pt from the bottom of the page
      editor.pointerUp({ x: 900, y: 1180 });
      const { left, top, width, height } = fields.fields()[0].locations;
      expect(left + width).toBeLessThanOrEqual(612);
      expect(top - height).toBeGreaterThanOrEqual(0); // TRANSIENT: the box hangs down from top
    });

    it('creates the selected preset, on the current page, for the current recipient', () => {
      const signature = TestBed.inject(FieldTypeService).getFieldTypeByKey('signature_signature_signature')!;
      state.selectedTypeKey.set('signature_signature_signature');
      pdf.currentPage.set(2);
      state.recipientIndex.set(2);

      editor.pointerDown({ x: 150, y: 150 });
      editor.pointerUp({ x: 300, y: 225 });

      const [field] = fields.fields();
      expect(field.inputType).toBe(signature.inputType);
      expect(field.contentType).toBe(signature.contentType);
      expect(field.name).toBe('signature_1');
      expect(field.locations.pageNumber).toBe(2);
      expect(field.recipientIndex).toBe(2);
    });

    it('draws nothing when no field type is selected', () => {
      state.selectedTypeKey.set('');
      editor.pointerDown({ x: 150, y: 150 });
      editor.pointerUp({ x: 300, y: 225 });
      expect(state.drawing()).toBeNull();
      expect(fields.fields()).toEqual([]);
    });
  });

  describe('selecting, moving and resizing', () => {
    beforeEach(() => {
      setup();
      fields.addField(makeField({ id: 'a' }), false);
    });

    it('selects a field that is clicked and deselects on empty canvas', () => {
      state.selectedTypeKey.set('');
      editor.pointerDown({ x: 200, y: 170 });
      editor.pointerUp({ x: 200, y: 170 });
      expect(state.selectedFieldId()).toBe('a');

      editor.pointerDown({ x: 20, y: 20 });
      expect(state.selectedFieldId()).toBeNull();
    });

    it('prefers the field drawn last when two overlap', () => {
      fields.addField(makeField({ id: 'b' }), false);
      editor.pointerDown({ x: 200, y: 170 });
      expect(state.selectedFieldId()).toBe('b');
    });

    it('only considers fields on the current page', () => {
      pdf.currentPage.set(2);
      state.selectedTypeKey.set('');
      editor.pointerDown({ x: 200, y: 170 });
      expect(state.selectedFieldId()).toBeNull();
    });

    it('drags a field live and records one undo step on release', () => {
      editor.pointerDown({ x: 200, y: 170 });
      editor.pointerMove({ x: 230, y: 185 }); // +20pt right, +10pt down
      expect(fields.fields()[0].locations).toEqual(jasmine.objectContaining({ left: 120, top: 690 }));
      expect(history.canUndo()).toBeFalse(); // nothing recorded while the drag is running

      editor.pointerUp({ x: 230, y: 185 });
      expect(history.getHistorySize().undo).toBe(1);

      editor.undo();
      expect(fields.fields()[0].locations).toEqual(jasmine.objectContaining({ left: 100, top: 700 }));
    });

    it('snaps a drag to the grid', () => {
      state.snapToGrid.set(true);
      editor.pointerDown({ x: 200, y: 170 });
      editor.pointerMove({ x: 212, y: 170 }); // +8pt -> left 108 -> 110
      expect(fields.fields()[0].locations.left).toBe(110);
    });

    it('does not record a step for a click without movement', () => {
      editor.pointerDown({ x: 200, y: 170 });
      editor.pointerUp({ x: 200, y: 170 });
      expect(history.canUndo()).toBeFalse();
    });

    it('resizes from a corner handle and undoes in one step', () => {
      state.selectedFieldId.set('a');
      editor.pointerDown({ x: 300, y: 213 }); // bottom-right handle
      editor.pointerMove({ x: 330, y: 228 }); // +20pt wide, +10pt tall
      editor.pointerUp({ x: 330, y: 228 });

      expect(fields.fields()[0].locations).toEqual({ pageNumber: 1, left: 100, top: 700, width: 120, height: 60 });
      expect(history.getHistorySize().undo).toBe(1);

      editor.undo();
      expect(fields.fields()[0].locations).toEqual({ pageNumber: 1, left: 100, top: 700, width: 100, height: 50 });
    });

    it('Escape during a drag puts the field back without recording anything', () => {
      editor.pointerDown({ x: 200, y: 170 });
      editor.pointerMove({ x: 260, y: 230 });
      expect(editor.cancelGesture()).toBeTrue();

      expect(fields.fields()[0].locations).toEqual({ pageNumber: 1, left: 100, top: 700, width: 100, height: 50 });
      expect(history.canUndo()).toBeFalse();

      // The abandoned drag must not finish later.
      editor.pointerUp({ x: 260, y: 230 });
      expect(fields.fields()[0].locations.left).toBe(100);
    });

    it('cancelGesture reports when there was nothing to cancel', () => {
      expect(editor.cancelGesture()).toBeFalse();
    });

    it('cancels a half-drawn field', () => {
      editor.pointerDown({ x: 20, y: 20 });
      expect(state.drawing()).not.toBeNull();
      expect(editor.cancelGesture()).toBeTrue();
      expect(state.drawing()).toBeNull();
    });

    it('tracks hover and cursor while no gesture runs', () => {
      editor.pointerMove({ x: 200, y: 170 });
      expect(state.hoveredFieldId()).toBe('a');
      expect(state.cursor()).toBe('pointer');

      editor.pointerMove({ x: 20, y: 20 });
      expect(state.hoveredFieldId()).toBeNull();
      expect(state.cursor()).toBe('default');
    });
  });

  describe('commands', () => {
    beforeEach(() => {
      setup();
      fields.addField(makeField({ id: 'a' }), false);
      state.selectedFieldId.set('a');
    });

    it('deletes the selected field and undo brings it back', () => {
      editor.deleteSelected();
      expect(fields.fields()).toEqual([]);
      expect(state.selectedFieldId()).toBeNull();

      editor.undo();
      expect(fields.fields().length).toBe(1);
    });

    it('updates the selected field', () => {
      editor.updateSelected({ name: 'renamed' });
      expect(state.selectedField()?.name).toBe('renamed');
    });

    it('keeps selectedField current after edits (it is derived, not a stale copy)', () => {
      editor.updateSelected({ locations: { pageNumber: 1, left: 5, top: 6, width: 7, height: 8 } });
      expect(state.selectedField()?.locations.left).toBe(5);
    });

    it('does nothing without a selection', () => {
      state.selectedFieldId.set(null);
      editor.deleteSelected();
      editor.updateSelected({ name: 'x' });
      expect(fields.fields()[0].name).toBe('text_field_1');
    });
  });

  describe('applyDocumentType', () => {
    it('flips top around the page height so fields stay put, and clears history', async () => {
      setup();
      fields.addField(
        makeField({ id: 'a', locations: { pageNumber: 1, left: 100, top: 692, width: 100, height: 50 } }),
      );
      expect(history.canUndo()).toBeTrue();

      await editor.applyDocumentType(AdobeDocumentType.LIBRARY);

      expect(state.documentType()).toBe(AdobeDocumentType.LIBRARY);
      expect(fields.fields()[0].locations).toEqual({ pageNumber: 1, left: 100, top: 100, width: 100, height: 50 });
      expect(history.canUndo()).toBeFalse();

      await editor.applyDocumentType(AdobeDocumentType.TRANSIENT);
      expect(fields.fields()[0].locations.top).toBe(692);
    });

    it("uses the height of each field's own page", async () => {
      setup({ 2: 595 });
      fields.replaceFields(
        [
          makeField({ id: 'a', locations: { pageNumber: 1, left: 1, top: 700, width: 10, height: 10 } }),
          makeField({ id: 'b', locations: { pageNumber: 2, left: 1, top: 500, width: 10, height: 10 } }),
        ],
        false,
      );

      await editor.applyDocumentType(AdobeDocumentType.LIBRARY);

      expect(fields.fields().map((f) => f.locations.top)).toEqual([92, 95]);
    });

    it('changes only the setting when there are no fields', async () => {
      setup();
      await editor.applyDocumentType(AdobeDocumentType.LIBRARY);
      expect(state.documentType()).toBe(AdobeDocumentType.LIBRARY);
    });

    it('leaves everything as it was if a page size cannot be read', async () => {
      setup();
      pdf.getPageHeightPoints = () => Promise.reject(new Error('no pdf'));
      const original = makeField({ id: 'a' });
      fields.addField(original, false);

      await expectAsync(editor.applyDocumentType(AdobeDocumentType.LIBRARY)).toBeRejected();

      expect(state.documentType()).toBe(AdobeDocumentType.TRANSIENT);
      expect(fields.fields()).toEqual([original]);
    });

    it('does nothing when the type is already set', async () => {
      setup();
      fields.addField(makeField({ id: 'a' }));
      await editor.applyDocumentType(AdobeDocumentType.TRANSIENT);
      expect(history.canUndo()).toBeTrue();
    });
  });
});
