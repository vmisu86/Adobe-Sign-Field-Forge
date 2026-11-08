import { TestBed } from '@angular/core/testing';
import { AdobeDocumentType } from '../models/field.model';
import { makeViewport, PAGE_HEIGHT_POINTS, PAGE_WIDTH_POINTS, TEST_SCALE } from '../testing/test-data';
import { CoordinateConversionService } from './coordinate-conversion.service';

describe('CoordinateConversionService', () => {
  let service: CoordinateConversionService;
  const viewport = makeViewport();

  beforeEach(() => {
    service = TestBed.inject(CoordinateConversionService);
  });

  it('converts canvas pixels to PDF points using the viewport scale', () => {
    expect(service.pixelsToPoints(150, TEST_SCALE)).toBe(100);
  });

  describe('TRANSIENT (origin bottom-left, top = distance from page bottom to the field top edge)', () => {
    it('flips the Y axis when converting from pixels', () => {
      // 150 px from the top of the canvas = 100 pt from the top = 692 pt from the bottom
      expect(service.convertYCoordinate(150, viewport, AdobeDocumentType.TRANSIENT)).toBe(PAGE_HEIGHT_POINTS - 100);
    });

    it('maps a stored top back to the canvas', () => {
      expect(service.getCanvasPosition(692, viewport, AdobeDocumentType.TRANSIENT)).toBe(150);
    });

    it('moves "down the page" by decreasing top', () => {
      expect(service.getYMultiplier(AdobeDocumentType.TRANSIENT)).toBe(-1);
    });
  });

  describe('LIBRARY (origin top-left, top = distance from page top to the field top edge)', () => {
    it('keeps the Y axis when converting from pixels', () => {
      expect(service.convertYCoordinate(150, viewport, AdobeDocumentType.LIBRARY)).toBe(100);
    });

    it('maps a stored top back to the canvas', () => {
      expect(service.getCanvasPosition(100, viewport, AdobeDocumentType.LIBRARY)).toBe(150);
    });

    it('moves "down the page" by increasing top', () => {
      expect(service.getYMultiplier(AdobeDocumentType.LIBRARY)).toBe(1);
    });
  });

  for (const type of [AdobeDocumentType.TRANSIENT, AdobeDocumentType.LIBRARY]) {
    it(`round-trips pixels -> points -> canvas for ${type}`, () => {
      for (const pixelY of [0, 1, 37.5, 150, 600, 1188]) {
        const top = service.convertYCoordinate(pixelY, viewport, type);
        expect(service.getCanvasPosition(top, viewport, type)).toBeCloseTo(pixelY, 9);
      }
    });
  }

  describe('boxFromClick', () => {
    const size = { width: 100, height: 20 };

    it('puts the top-left corner of the box at the click (TRANSIENT: top measured from the page bottom)', () => {
      // 150 px across and down at 1.5x = 100 pt across and 100 pt down from the page top
      expect(service.boxFromClick({ x: 150, y: 150 }, size, viewport, AdobeDocumentType.TRANSIENT)).toEqual({
        left: 100,
        top: 692,
        width: 100,
        height: 20,
      });
    });

    it('measures top from the page top in LIBRARY', () => {
      expect(service.boxFromClick({ x: 150, y: 150 }, size, viewport, AdobeDocumentType.LIBRARY).top).toBe(100);
    });

    it('moves a box that would hang off the right or bottom edge back onto the page', () => {
      const box = service.boxFromClick({ x: 900, y: 1180 }, size, viewport, AdobeDocumentType.TRANSIENT);
      expect(box.left + box.width).toBeLessThanOrEqual(PAGE_WIDTH_POINTS);
      expect(box.top - box.height).toBeGreaterThanOrEqual(0);

      const library = service.boxFromClick({ x: 900, y: 1180 }, size, viewport, AdobeDocumentType.LIBRARY);
      expect(library.top + library.height).toBeLessThanOrEqual(PAGE_HEIGHT_POINTS);
    });

    it('moves a box that would hang off the left or top edge back onto the page', () => {
      const box = service.boxFromClick({ x: -50, y: -50 }, size, viewport, AdobeDocumentType.TRANSIENT);
      expect(box.left).toBe(0);
      expect(box.top).toBe(PAGE_HEIGHT_POINTS);

      expect(service.boxFromClick({ x: -50, y: -50 }, size, viewport, AdobeDocumentType.LIBRARY).top).toBe(0);
    });
  });

  it('rounds stored values to hundredths of a point', () => {
    expect(service.roundPoints(153.33333333333334)).toBe(153.33);
    expect(service.roundPoints(99.666666)).toBe(99.67);
    expect(service.roundPoints(100)).toBe(100);
  });

  describe('snapToGrid', () => {
    it('returns the value untouched when snapping is off', () => {
      expect(service.snapToGrid(14.3, 10, false)).toBe(14.3);
    });

    it('rounds to the nearest grid line when on', () => {
      expect(service.snapToGrid(14, 10, true)).toBe(10);
      expect(service.snapToGrid(16, 10, true)).toBe(20);
      expect(service.snapToGrid(-4, 10, true) + 0).toBe(0);
    });
  });

  it('reads canvas coordinates relative to the canvas box', () => {
    const canvas = {
      getBoundingClientRect: () => ({ left: 10, top: 20 }),
    } as unknown as HTMLCanvasElement;
    const event = { clientX: 110, clientY: 70 } as MouseEvent;
    expect(service.getCanvasCoordinates(event, canvas)).toEqual({ x: 100, y: 50 });
  });
});
