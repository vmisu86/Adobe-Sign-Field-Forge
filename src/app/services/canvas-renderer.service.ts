import { inject, Injectable } from '@angular/core';
import { AdobeDocumentType, Field, FieldKind } from '../models/field.model';
import { ViewportGeometry } from '../models/pdf.types';
import { CoordinateConversionService } from './coordinate-conversion.service';
import { ThemeService } from './theme.service';

/** How a field is shown right now. */
export interface FieldPaintState {
  selected: boolean;
  hovered: boolean;
  /** Something else is selected: push this field back so the selection stands out. */
  dimmed: boolean;
}

const HANDLE_SIZE = 8;
const FILL_OPACITY = 0.12;
const DIMMED_OPACITY = 0.55;
const GRID_STEP_POINTS = 50;

/** Draws on the overlay canvas. All colours and fonts come from the design tokens through ThemeService. */
@Injectable({
  providedIn: 'root',
})
export class CanvasRendererService {
  private readonly coordService = inject(CoordinateConversionService);
  private readonly theme = inject(ThemeService);

  /** Clear the entire canvas */
  clearCanvas(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /** Draw grid overlay on canvas */
  drawGrid(ctx: CanvasRenderingContext2D, viewport: ViewportGeometry, documentType: AdobeDocumentType): void {
    const theme = this.theme.canvas();
    ctx.save();
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 1;
    ctx.font = `11px ${theme.fontSans}`;
    ctx.fillStyle = theme.textMuted;

    const pageWidthInPoints = viewport.width / viewport.scale;
    const pageHeightInPoints = viewport.height / viewport.scale;

    for (let pointX = 0; pointX <= pageWidthInPoints; pointX += GRID_STEP_POINTS) {
      const pixelX = pointX * viewport.scale;
      ctx.beginPath();
      ctx.moveTo(pixelX, 0);
      ctx.lineTo(pixelX, viewport.height);
      ctx.stroke();
      ctx.fillText(pointX.toString(), pixelX + 2, 12);
    }

    for (let pointY = 0; pointY <= pageHeightInPoints; pointY += GRID_STEP_POINTS) {
      const pixelY = pointY * viewport.scale;
      ctx.beginPath();
      ctx.moveTo(0, pixelY);
      ctx.lineTo(viewport.width, pixelY);
      ctx.stroke();

      // The number printed is the `top` a field would have at this line, so it follows the document type.
      const displayY =
        documentType === AdobeDocumentType.LIBRARY ? Math.round(pointY) : Math.round(pageHeightInPoints - pointY);
      ctx.fillText(displayY.toString(), 2, pixelY - 2);
    }

    ctx.fillText(
      `Page: ${pageWidthInPoints.toFixed(0)} × ${pageHeightInPoints.toFixed(0)} points`,
      10,
      viewport.height - 10,
    );

    ctx.restore();
  }

  /** Draw the eight resize handles around a box */
  drawSelectionHandles(ctx: CanvasRenderingContext2D, left: number, top: number, width: number, height: number): void {
    const theme = this.theme.canvas();
    const handles = [
      { x: left, y: top },
      { x: left + width, y: top },
      { x: left, y: top + height },
      { x: left + width, y: top + height },
      { x: left + width / 2, y: top },
      { x: left + width / 2, y: top + height },
      { x: left, y: top + height / 2 },
      { x: left + width, y: top + height / 2 },
    ];

    ctx.save();
    ctx.fillStyle = theme.surface;
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    for (const handle of handles) {
      ctx.fillRect(handle.x - HANDLE_SIZE / 2, handle.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
      ctx.strokeRect(handle.x - HANDLE_SIZE / 2, handle.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    }
    ctx.restore();
  }

  /**
   * Draw one field: a tinted box in its kind's colour, its name, and (when selected) an accent outline,
   * handles and its coordinates. `recipientLabel` is drawn under the name when it is not empty.
   */
  drawField(
    ctx: CanvasRenderingContext2D,
    field: Field,
    viewport: ViewportGeometry,
    documentType: AdobeDocumentType,
    kind: FieldKind,
    state: FieldPaintState,
    recipientLabel: string,
  ): void {
    const theme = this.theme.canvas();
    const color = theme.kinds[kind];
    const left = field.locations.left * viewport.scale;
    const width = field.locations.width * viewport.scale;
    const height = field.locations.height * viewport.scale;
    const top = this.coordService.getCanvasPosition(field.locations.top, viewport, documentType);
    const opacity = state.dimmed ? DIMMED_OPACITY : 1;

    ctx.save();

    ctx.globalAlpha = opacity * FILL_OPACITY;
    ctx.fillStyle = color;
    ctx.fillRect(left, top, width, height);

    ctx.globalAlpha = opacity;
    ctx.strokeStyle = state.selected ? theme.accent : color;
    ctx.lineWidth = state.selected || state.hovered ? 2 : 1.5;
    ctx.strokeRect(left, top, width, height);

    // Text stays inside the box, however small it is.
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, width, height);
    ctx.clip();
    ctx.fillStyle = color;
    ctx.font = `600 12px ${theme.fontSans}`;
    ctx.fillText(field.name, left + 4, top + 14);
    if (recipientLabel) {
      ctx.font = `11px ${theme.fontSans}`;
      ctx.fillText(recipientLabel, left + 4, top + 27);
    }
    if (field.required) {
      ctx.fillStyle = theme.danger;
      ctx.font = `700 14px ${theme.fontSans}`;
      ctx.fillText('*', left + width - 12, top + 14);
    }
    ctx.restore();

    if (state.selected) {
      this.drawSelectionHandles(ctx, left, top, width, height);
      ctx.font = `11px ${theme.fontMono}`;
      ctx.fillStyle = theme.textMuted;
      const coordinates = `(${Math.round(field.locations.left)}, ${Math.round(field.locations.top)})`;
      ctx.fillText(coordinates, left, top + height + 16);
    }

    ctx.restore();
  }

  /** Draw the dashed rectangle and its numbers while a field is being dragged out */
  drawFieldPreview(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    currentX: number,
    currentY: number,
    viewport: ViewportGeometry,
    documentType: AdobeDocumentType,
  ): void {
    const theme = this.theme.canvas();
    const pixelLeft = Math.min(startX, currentX);
    const pixelTop = Math.min(startY, currentY);
    const pixelWidth = Math.abs(currentX - startX);
    const pixelHeight = Math.abs(currentY - startY);

    ctx.save();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(startX, startY, currentX - startX, currentY - startY);
    ctx.setLineDash([]);

    const pointsLeft = this.coordService.pixelsToPoints(pixelLeft, viewport.scale);
    const pointsTop = this.coordService.convertYCoordinate(pixelTop, viewport, documentType);
    const pointsWidth = this.coordService.pixelsToPoints(pixelWidth, viewport.scale);
    const pointsHeight = this.coordService.pixelsToPoints(pixelHeight, viewport.scale);

    ctx.fillStyle = theme.text;
    ctx.font = `12px ${theme.fontMono}`;
    ctx.fillText(
      `L: ${pointsLeft.toFixed(1)}, T: ${pointsTop.toFixed(1)}, W: ${pointsWidth.toFixed(1)}, H: ${pointsHeight.toFixed(1)}`,
      pixelLeft,
      pixelTop - 6,
    );
    ctx.restore();
  }

  /** Check if a point is inside a field's bounds */
  isPointInField(
    x: number,
    y: number,
    field: Field,
    viewport: ViewportGeometry,
    documentType: AdobeDocumentType,
  ): boolean {
    const left = field.locations.left * viewport.scale;
    const width = field.locations.width * viewport.scale;
    const height = field.locations.height * viewport.scale;
    const top = this.coordService.getCanvasPosition(field.locations.top, viewport, documentType);

    return x >= left && x <= left + width && y >= top && y <= top + height;
  }
}
