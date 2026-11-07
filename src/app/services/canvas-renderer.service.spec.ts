import { TestBed } from '@angular/core/testing';
import { AdobeDocumentType, FieldKind } from '../models/field.model';
import { makeField, makeViewport } from '../testing/test-data';
import { CanvasRendererService, FieldPaintState } from './canvas-renderer.service';
import { ThemeService } from './theme.service';

describe('CanvasRendererService', () => {
  let service: CanvasRendererService;
  const viewport = makeViewport();
  const idle: FieldPaintState = { selected: false, hovered: false, dimmed: false };
  let theme: ThemeService;

  beforeEach(() => {
    service = TestBed.inject(CanvasRendererService);
    theme = TestBed.inject(ThemeService);
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
      service.drawField(ctx, makeField(), viewport, AdobeDocumentType.TRANSIENT, 'text', idle, '');
      expect(alphaAt(ctx, 260, 190)).toBeGreaterThan(0); // inside the translucent fill, away from the labels
      expect(alphaAt(ctx, 40, 40)).toBe(0);
    });

    // The left edge of makeField() runs along x = 150 (canvas pixels). (150, 157) is on it, clear of the
    // corner and middle resize handles, which are drawn over the outline when a field is selected.
    function strokeRgbAt(kind: FieldKind, state: FieldPaintState): number[] {
      const { ctx } = createCanvas();
      service.drawField(ctx, makeField(), viewport, AdobeDocumentType.TRANSIENT, kind, state, '');
      return Array.from(ctx.getImageData(150, 157, 1, 1).data.slice(0, 3));
    }

    const rgb = (colour: string) => [1, 3, 5].map((i) => parseInt(colour.slice(i, i + 2), 16));

    /** Anti-aliasing of a thin stroke can move a channel by a step or two. */
    function expectRgb(actual: number[], colour: string, message: string): void {
      const expected = rgb(colour);
      actual.forEach((channel, i) => {
        expect(Math.abs(channel - expected[i]))
          .withContext(`${message}, channel ${i}`)
          .toBeLessThanOrEqual(3);
      });
    }

    it('outlines each kind of field in its own token colour', () => {
      const kinds = theme.canvas().kinds;
      for (const kind of Object.keys(kinds) as FieldKind[]) {
        expectRgb(strokeRgbAt(kind, idle), kinds[kind], kind);
      }
    });

    it('outlines the selected field in the accent colour, whatever its kind', () => {
      for (const kind of ['text', 'signature', 'date', 'choice'] as const) {
        expectRgb(strokeRgbAt(kind, { ...idle, selected: true }), theme.canvas().accent, kind);
      }
    });

    it('fades a field when something else is selected', () => {
      const alphaOf = (state: FieldPaintState) => {
        const { ctx } = createCanvas();
        service.drawField(ctx, makeField(), viewport, AdobeDocumentType.TRANSIENT, 'text', state, '');
        return ctx.getImageData(150, 157, 1, 1).data[3];
      };
      expect(alphaOf({ ...idle, dimmed: true })).toBeLessThan(alphaOf(idle));
    });

    it('draws the resize handles only for the selected field', () => {
      const handleAlpha = (state: FieldPaintState) => {
        const { ctx } = createCanvas();
        service.drawField(ctx, makeField(), viewport, AdobeDocumentType.TRANSIENT, 'text', state, '');
        return ctx.getImageData(148, 136, 1, 1).data[3]; // inside the top-left handle, outside the box
      };
      expect(handleAlpha(idle)).toBe(0);
      expect(handleAlpha({ ...idle, selected: true })).toBeGreaterThan(0);
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
