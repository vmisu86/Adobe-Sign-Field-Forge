import { Injectable } from '@angular/core';
import { FieldKind } from '../models/field.model';

/** The design tokens a canvas needs. A canvas cannot use CSS variables, so they are read once and passed in. */
export interface CanvasTheme {
  accent: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  danger: string;
  fontSans: string;
  fontMono: string;
  /** Stroke colour of each field kind. */
  kinds: Record<FieldKind, string>;
}

/**
 * Reads the design tokens (the `--ff-*` custom properties on :root, defined in src/styles/tokens.less)
 * for code that draws on a canvas. There are no colours in TypeScript: change a token and the canvas follows.
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private cached: CanvasTheme | null = null;

  canvas(): CanvasTheme {
    return (this.cached ??= this.read());
  }

  /** Forget the cached values, for when the tokens change at runtime. */
  refresh(): void {
    this.cached = null;
  }

  private read(): CanvasTheme {
    const styles = getComputedStyle(document.documentElement);
    const token = (name: string): string => styles.getPropertyValue(name).trim();

    return {
      accent: token('--ff-accent'),
      surface: token('--ff-surface'),
      border: token('--ff-border'),
      text: token('--ff-text'),
      textMuted: token('--ff-text-muted'),
      danger: token('--ff-danger'),
      fontSans: token('--ff-font-sans'),
      fontMono: token('--ff-font-mono'),
      kinds: {
        text: token('--ff-field-text'),
        signature: token('--ff-field-signature'),
        date: token('--ff-field-date'),
        choice: token('--ff-field-choice'),
      },
    };
  }
}
