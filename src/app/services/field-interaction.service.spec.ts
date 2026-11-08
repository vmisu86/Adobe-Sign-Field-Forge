import { TestBed } from '@angular/core/testing';
import { AdobeDocumentType } from '../models/field.model';
import { makeField, makeViewport } from '../testing/test-data';
import { FieldInteractionService } from './field-interaction.service';

describe('FieldInteractionService', () => {
  let service: FieldInteractionService;
  const viewport = makeViewport();
  const T = AdobeDocumentType.TRANSIENT;
  const L = AdobeDocumentType.LIBRARY;

  beforeEach(() => {
    service = TestBed.inject(FieldInteractionService);
  });

  describe('drag', () => {
    it('returns null when no drag is running', () => {
      expect(service.calculateDragPosition(10, 10, viewport, T, false, 10)).toBeNull();
    });

    it('moves right and down; "down" lowers top in TRANSIENT', () => {
      service.startDrag(makeField(), 200, 300);
      // 30 px right / 15 px down = 20 pt right / 10 pt down
      expect(service.calculateDragPosition(230, 315, viewport, T, false, 10)).toEqual({
        left: 120,
        top: 690,
      });
    });

    it('moves down by raising top in LIBRARY', () => {
      service.startDrag(
        makeField({ locations: { pageNumber: 1, left: 100, top: 50, width: 100, height: 50 } }),
        200,
        300,
      );
      expect(service.calculateDragPosition(230, 315, viewport, L, false, 10)).toEqual({
        left: 120,
        top: 60,
      });
    });

    it('snaps the result to the grid', () => {
      service.startDrag(makeField(), 200, 300);
      const result = service.calculateDragPosition(212, 300, viewport, T, true, 10);
      expect(result?.left).toBe(110); // 100 + 8pt = 108 -> 110
    });

    it('completeDrag reports where the drag started and resets the state', () => {
      service.startDrag(makeField(), 1, 1);
      expect(service.completeDrag()).toEqual({ startPos: { left: 100, top: 700 } });
      expect(service.getState().isDragging).toBeFalse();
      expect(service.completeDrag()).toBeNull();
    });
  });

  describe('resize', () => {
    const bounds = { left: 100, top: 700, width: 100, height: 50 };
    const field = () => makeField({ locations: { pageNumber: 1, ...bounds } });

    it('returns null when no resize is running', () => {
      expect(service.calculateResizeBounds(0, 0, viewport, T, false, 10)).toBeNull();
    });

    it('grows from the bottom-right handle (top unchanged)', () => {
      service.startResize(field(), 'br', 300, 225);
      expect(service.calculateResizeBounds(330, 240, viewport, T, false, 10)).toEqual({
        left: 100,
        top: 700,
        width: 120,
        height: 60,
      });
    });

    it('moves the top edge from the top-left handle: TRANSIENT lowers top when the edge goes down', () => {
      service.startResize(field(), 'tl', 150, 150);
      // drag 15 px right and 15 px down (10 pt each): left +10, width -10, top edge down 10 -> top -10, height -10
      expect(service.calculateResizeBounds(165, 165, viewport, T, false, 10)).toEqual({
        left: 110,
        top: 690,
        width: 90,
        height: 40,
      });
    });

    it('does the same in LIBRARY with top increasing', () => {
      service.startResize(
        makeField({ locations: { pageNumber: 1, left: 100, top: 100, width: 100, height: 50 } }),
        'tl',
        150,
        150,
      );
      expect(service.calculateResizeBounds(165, 165, viewport, L, false, 10)).toEqual({
        left: 110,
        top: 110,
        width: 90,
        height: 40,
      });
    });

    it('never shrinks below the minimum size', () => {
      service.startResize(field(), 'br', 300, 225);
      const result = service.calculateResizeBounds(0, 0, viewport, T, false, 10);
      expect(result?.width).toBe(20);
      expect(result?.height).toBe(20);
    });

    it('completeResize returns the starting bounds', () => {
      service.startResize(field(), 'r', 0, 0);
      expect(service.completeResize()).toEqual({ startBounds: bounds });
      expect(service.getState().isResizing).toBeFalse();
    });
  });

  it('cancelOperation clears every part of the state', () => {
    service.startDrag(makeField(), 5, 5);
    service.cancelOperation();
    expect(service.getState()).toEqual({
      isDragging: false,
      isResizing: false,
      dragStartPos: null,
      dragFieldStartPos: null,
      resizeHandle: null,
      resizeStartBounds: null,
    });
  });

  describe('handles and cursor', () => {
    // TRANSIENT, top=700 on a 792pt page at 1.5x: canvas top = (792-700)*1.5 = 138, left = 150, 150x75 px box
    const field = makeField();

    it('hits the corner and edge handles', () => {
      expect(service.getResizeHandleAtPoint(150, 138, field, viewport, T)).toBe('tl');
      expect(service.getResizeHandleAtPoint(300, 138, field, viewport, T)).toBe('tr');
      expect(service.getResizeHandleAtPoint(150, 213, field, viewport, T)).toBe('bl');
      expect(service.getResizeHandleAtPoint(300, 213, field, viewport, T)).toBe('br');
      expect(service.getResizeHandleAtPoint(225, 138, field, viewport, T)).toBe('t');
      expect(service.getResizeHandleAtPoint(225, 213, field, viewport, T)).toBe('b');
      expect(service.getResizeHandleAtPoint(150, 175.5, field, viewport, T)).toBe('l');
      expect(service.getResizeHandleAtPoint(300, 175.5, field, viewport, T)).toBe('r');
    });

    it('misses in the middle of the field and far away', () => {
      expect(service.getResizeHandleAtPoint(225, 175, field, viewport, T)).toBeNull();
      expect(service.getResizeHandleAtPoint(10, 10, field, viewport, T)).toBeNull();
    });

    it('picks the cursor from what is under the pointer', () => {
      expect(service.getCursorStyle(0, 0, null, null, viewport, T)).toBe('default');
      expect(service.getCursorStyle(0, 0, null, field, viewport, T)).toBe('pointer');
      expect(service.getCursorStyle(300, 213, field, field, viewport, T)).toBe('nwse-resize');
      expect(service.getCursorStyle(300, 138, field, field, viewport, T)).toBe('nesw-resize');
      expect(service.getCursorStyle(225, 138, field, field, viewport, T)).toBe('ns-resize');
      expect(service.getCursorStyle(150, 175.5, field, field, viewport, T)).toBe('ew-resize');
      expect(service.getCursorStyle(225, 175, field, field, viewport, T)).toBe('move');
    });
  });
});
