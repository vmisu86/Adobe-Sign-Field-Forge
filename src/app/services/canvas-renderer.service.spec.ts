import { TestBed } from '@angular/core/testing';
import { AdobeDocumentType } from '../models/field.model';
import { makeField, makeViewport } from '../testing/test-data';
import { CanvasRendererService } from './canvas-renderer.service';

describe('CanvasRendererService', () => {
  let service: CanvasRendererService;
  const viewport = makeViewport();

  beforeEach(() => {
    service = TestBed.inject(CanvasRendererService);
  });

  describe('isPointInField', () => {
    // TRANSIENT top=700 -> canvas y = (792 - 700) * 1.5 = 138; x = 150; box is 150 x 75 px
    const field = makeField();

    it('hits inside the box, including its edges', () => {
      expect(service.isPointInField(200, 170, field, viewport, AdobeDocumentType.TRANSIENT)).toBeTrue();
      expect(service.isPointInField(150, 138, field, viewport, AdobeDocumentType.TRANSIENT)).toBeTrue();
      expect(service.isPointInField(300, 213, field, viewport, AdobeDocumentType.TRANSIENT)).toBeTrue();
    });

    it('misses outside the box', () => {
      expect(service.isPointInField(149, 170, field, viewport, AdobeDocumentType.TRANSIENT)).toBeFalse();
      expect(service.isPointInField(200, 214, field, viewport, AdobeDocumentType.TRANSIENT)).toBeFalse();
    });

    it('reads the same stored top differently per document type', () => {
      // In LIBRARY the stored top 700 is measured from the top of the page, so the box sits far lower.
      expect(service.isPointInField(200, 170, field, viewport, AdobeDocumentType.LIBRARY)).toBeFalse();
      expect(service.isPointInField(200, 1100, field, viewport, AdobeDocumentType.LIBRARY)).toBeTrue();
    });
  });

  describe('drawing', () => {
    function createCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      return { canvas, ctx: canvas.getContext('2d')! };
    }

    function alphaAt(ctx: CanvasRenderingContext2D, x: number, y: number): number {
      return ctx.getImageData(x, y, 1, 1).data[3];
    }

    it('paints the field where isPointInField says it is', () => {
      const { ctx } = createCanvas();
      service.drawField(ctx, makeField(), viewport, AdobeDocumentType.TRANSIENT, '#ff0000', false, false, 'SIGNER');
      expect(alphaAt(ctx, 260, 190)).toBeGreaterThan(0); // inside the translucent fill, away from the labels
      expect(alphaAt(ctx, 40, 40)).toBe(0);
    });

    it('clearCanvas wipes everything', () => {
      const { canvas, ctx } = createCanvas();
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 50, 50);
      service.clearCanvas(canvas);
      expect(alphaAt(ctx, 10, 10)).toBe(0);
    });

    it('draws the grid with page dimensions without throwing', () => {
      const { ctx } = createCanvas();
      expect(() => service.drawGrid(ctx, viewport, AdobeDocumentType.TRANSIENT)).not.toThrow();
      expect(alphaAt(ctx, 75, 400)).toBeGreaterThan(0); // the vertical line at x = 50pt
    });
  });
});
