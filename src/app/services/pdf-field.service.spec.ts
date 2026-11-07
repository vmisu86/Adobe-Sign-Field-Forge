import { TestBed } from '@angular/core/testing';
import { makeField } from '../testing/test-data';
import { HistoryService } from './history.service';
import { PdfFieldService } from './pdf-field.service';

describe('PdfFieldService', () => {
  let service: PdfFieldService;
  let history: HistoryService;

  beforeEach(() => {
    service = TestBed.inject(PdfFieldService);
    history = TestBed.inject(HistoryService);
  });

  it('starts empty', () => {
    expect(service.fields()).toEqual([]);
  });

  describe('addField', () => {
    it('adds the field and can undo and redo it', () => {
      const field = makeField();
      service.addField(field);
      expect(service.fields()).toEqual([field]);

      history.undo();
      expect(service.fields()).toEqual([]);
      history.redo();
      expect(service.fields()).toEqual([field]);
    });

    it('skips history when asked', () => {
      service.addField(makeField(), false);
      expect(history.canUndo()).toBeFalse();
    });

    it('never mutates the list it replaced', () => {
      const before = service.fields();
      service.addField(makeField());
      expect(before).toEqual([]);
      expect(service.fields()).not.toBe(before);
    });
  });

  describe('updateField', () => {
    it('merges the changes into a new object and undoes them', () => {
      const original = makeField({ id: 'a', name: 'old' });
      service.addField(original, false);

      service.updateField('a', { name: 'new', required: true });
      expect(service.fields()[0]).toEqual({ ...original, name: 'new', required: true });
      expect(service.fields()[0]).not.toBe(original);

      history.undo();
      expect(service.fields()[0]).toEqual(original);
    });

    it('ignores an unknown id', () => {
      service.updateField('missing', { name: 'x' });
      expect(history.canUndo()).toBeFalse();
    });
  });

  describe('deleteField', () => {
    it('removes the field and restores it on undo', () => {
      const a = makeField({ id: 'a' });
      const b = makeField({ id: 'b' });
      service.addField(a, false);
      service.addField(b, false);

      service.deleteField('a');
      expect(service.fields()).toEqual([b]);

      history.undo();
      expect(
        service
          .fields()
          .map((f) => f.id)
          .sort(),
      ).toEqual(['a', 'b']);
    });
  });

  describe('moveField', () => {
    beforeEach(() => service.addField(makeField({ id: 'a' }), false));

    it('changes only left and top', () => {
      service.moveField('a', 10, 20, false);
      expect(service.fields()[0].locations).toEqual({ pageNumber: 1, left: 10, top: 20, width: 100, height: 50 });
    });

    it('records one undo step from the position the drag started at', () => {
      // A drag moves the field live without history, then commits once.
      service.moveField('a', 50, 650, false);
      service.moveField('a', 60, 640, false);
      service.moveField('a', 60, 640, true, 100, 700);
      expect(history.getHistorySize().undo).toBe(1);

      history.undo();
      expect(service.fields()[0].locations.left).toBe(100);
      expect(service.fields()[0].locations.top).toBe(700);
    });

    it('records nothing when the position did not change', () => {
      service.moveField('a', 100, 700, true, 100, 700);
      expect(history.canUndo()).toBeFalse();
    });
  });

  describe('resizeField', () => {
    beforeEach(() => service.addField(makeField({ id: 'a' }), false));

    it('changes the whole box and undoes to the starting bounds', () => {
      service.resizeField('a', 90, 710, 130, 70, false);
      service.resizeField('a', 90, 710, 130, 70, true, { left: 100, top: 700, width: 100, height: 50 });

      expect(service.fields()[0].locations).toEqual({ pageNumber: 1, left: 90, top: 710, width: 130, height: 70 });
      history.undo();
      expect(service.fields()[0].locations).toEqual({ pageNumber: 1, left: 100, top: 700, width: 100, height: 50 });
    });

    it('records nothing when the box did not change', () => {
      service.resizeField('a', 100, 700, 100, 50, true);
      expect(history.canUndo()).toBeFalse();
    });
  });

  describe('replaceFields', () => {
    it('is a single undo step', () => {
      const original = [makeField({ id: 'a' }), makeField({ id: 'b' })];
      service.replaceFields(original, false);

      const imported = [makeField({ id: 'c' })];
      service.replaceFields(imported);
      expect(service.fields()).toEqual(imported);
      expect(history.getHistorySize().undo).toBe(1);

      history.undo();
      expect(service.fields()).toEqual(original);
      history.redo();
      expect(service.fields()).toEqual(imported);
    });
  });
});
