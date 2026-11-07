import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

/** Relative luminance and contrast ratio, as WCAG 2.2 defines them. */
function luminance(colour: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(colour.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

describe('design tokens (src/styles/tokens.less)', () => {
  let theme: ThemeService;

  beforeEach(() => {
    theme = TestBed.inject(ThemeService);
  });

  it('are defined: the global stylesheet is loaded and every token the canvas reads has a value', () => {
    const t = theme.canvas();
    for (const value of [
      t.accent,
      t.surface,
      t.border,
      t.text,
      t.textMuted,
      t.danger,
      t.fontSans,
      t.fontMono,
      ...Object.values(t.kinds),
    ]) {
      expect(value).toBeTruthy();
    }
  });

  it('caches until refreshed', () => {
    const first = theme.canvas();
    expect(theme.canvas()).toBe(first);
    theme.refresh();
    expect(theme.canvas()).not.toBe(first);
    expect(theme.canvas()).toEqual(first);
  });

  describe('contrast on the white surface and PDF page', () => {
    it('keeps the outline of every field kind at 3:1 or better (WCAG non-text contrast)', () => {
      const { kinds, surface } = theme.canvas();
      for (const [kind, colour] of Object.entries(kinds)) {
        expect(contrast(colour, surface)).withContext(kind).toBeGreaterThanOrEqual(3);
      }
    });

    it('keeps the selection accent at 3:1 or better', () => {
      const { accent, surface } = theme.canvas();
      expect(contrast(accent, surface)).toBeGreaterThanOrEqual(3);
    });

    it('keeps text at AA (4.5:1) or better', () => {
      const { text, textMuted, accent, danger, surface } = theme.canvas();
      for (const [name, colour] of Object.entries({ text, textMuted, accent, danger })) {
        expect(contrast(colour, surface)).withContext(name).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('makes white text on the accent colour readable (a primary button)', () => {
      const { accent, surface } = theme.canvas();
      expect(contrast(surface, accent)).toBeGreaterThanOrEqual(4.5);
    });
  });

  it('gives the four field kinds four different colours', () => {
    const colours = Object.values(theme.canvas().kinds);
    expect(new Set(colours).size).toBe(4);
  });

  it('never uses a field-kind colour for the selection accent', () => {
    const { accent, kinds } = theme.canvas();
    expect(Object.values(kinds)).not.toContain(accent);
  });
});
