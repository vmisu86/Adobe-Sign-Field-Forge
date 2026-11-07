import { fitWidthScale, MAX_SCALE, MIN_SCALE, nextZoomStep, sizeCanvas, ZOOM_STEPS } from './zoom';

describe('zoom', () => {
  describe('fitWidthScale', () => {
    it('fills the available width exactly', () => {
      expect(fitWidthScale(612, 612)).toBe(1);
      expect(fitWidthScale(918, 612)).toBe(1.5);
      expect(fitWidthScale(306, 612)).toBe(0.5);
    });

    it('rounds to three decimals so tiny window changes do not move it', () => {
      expect(fitWidthScale(700, 612)).toBe(1.144);
      expect(fitWidthScale(700.2, 612)).toBe(1.144);
    });

    it('stays within the zoom range', () => {
      expect(fitWidthScale(10, 612)).toBe(MIN_SCALE);
      expect(fitWidthScale(100000, 612)).toBe(MAX_SCALE);
    });

    it('is 100% until the workspace is measured or the page has no width', () => {
      expect(fitWidthScale(0, 612)).toBe(1);
      expect(fitWidthScale(-5, 612)).toBe(1);
      expect(fitWidthScale(800, 0)).toBe(1);
    });
  });

  describe('nextZoomStep', () => {
    it('moves to the neighbouring step', () => {
      expect(nextZoomStep(1, 1)).toBe(1.25);
      expect(nextZoomStep(1, -1)).toBe(0.75);
    });

    it('moves from between steps to the next one in that direction', () => {
      expect(nextZoomStep(1.144, 1)).toBe(1.25);
      expect(nextZoomStep(1.144, -1)).toBe(1);
    });

    it('stops at both ends', () => {
      expect(nextZoomStep(MAX_SCALE, 1)).toBe(MAX_SCALE);
      expect(nextZoomStep(MIN_SCALE, -1)).toBe(MIN_SCALE);
    });

    it('treats a value a hair off a step as that step', () => {
      expect(nextZoomStep(1.2500001, 1)).toBe(1.5);
    });

    it('offers 100% as a step', () => {
      expect(ZOOM_STEPS).toContain(1);
    });
  });

  describe('sizeCanvas', () => {
    it('gives the canvas a backing store at the pixel ratio and a CSS size at 1x', () => {
      const canvas = document.createElement('canvas');
      sizeCanvas(canvas, 612.4, 792, 2);
      expect([canvas.width, canvas.height]).toEqual([1224, 1584]);
      expect([canvas.style.width, canvas.style.height]).toEqual(['612.4px', '792px']);
    });
  });
});
