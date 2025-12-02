import { Injectable } from '@angular/core';
import { AdobeDocumentType, Field } from '../models/field.model';
import { CoordinateConversionService } from './coordinate-conversion.service';

@Injectable({
  providedIn: 'root'
})
export class CanvasRendererService {
  constructor(private coordService: CoordinateConversionService) {}

  /**
   * Clear the entire canvas
   */
  clearCanvas(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * Draw grid overlay on canvas
   */
  drawGrid(
    ctx: CanvasRenderingContext2D,
    viewport: any,
    documentType: AdobeDocumentType
  ): void {
    ctx.save();
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    ctx.font = '10px Arial';
    ctx.fillStyle = '#999';

    const pageWidthInPoints = viewport.width / viewport.scale;
    const pageHeightInPoints = viewport.height / viewport.scale;

    // Draw vertical grid lines
    for (let pointX = 0; pointX <= pageWidthInPoints; pointX += 50) {
      const pixelX = pointX * viewport.scale;
      ctx.beginPath();
      ctx.moveTo(pixelX, 0);
      ctx.lineTo(pixelX, viewport.height);
      ctx.stroke();
      ctx.fillText(pointX.toString(), pixelX + 2, 12);
    }

    // Draw horizontal grid lines
    for (let pointY = 0; pointY <= pageHeightInPoints; pointY += 50) {
      const pixelY = pointY * viewport.scale;
      ctx.beginPath();
      ctx.moveTo(0, pixelY);
      ctx.lineTo(viewport.width, pixelY);
      ctx.stroke();

      const displayY = documentType === AdobeDocumentType.LIBRARY
        ? Math.round(pointY)
        : Math.round(pageHeightInPoints - pointY);

      ctx.fillText(displayY.toString(), 2, pixelY - 2);
    }

    // Draw page dimensions
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.fillText(
      `Page: ${pageWidthInPoints.toFixed(0)} × ${pageHeightInPoints.toFixed(0)} points`,
      10,
      viewport.height - 10
    );

    ctx.restore();
  }

  /**
   * Draw selection handles around a field
   */
  drawSelectionHandles(
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    width: number,
    height: number
  ): void {
    const handleSize = 8;
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

    ctx.fillStyle = '#1890ff';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;

    handles.forEach(handle => {
      ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
    });
  }

  /**
   * Draw a single field on the canvas
   */
  drawField(
    ctx: CanvasRenderingContext2D,
    field: Field,
    viewport: any,
    documentType: AdobeDocumentType,
    color: string,
    isSelected: boolean,
    isHovered: boolean,
    recipientLabel: string
  ): void {
    const left = field.locations.left * viewport.scale;
    const width = field.locations.width * viewport.scale;
    const height = field.locations.height * viewport.scale;
    const top = this.coordService.getCanvasPosition(field.locations.top, viewport, documentType);

    // Draw field background and border
    ctx.strokeStyle = isSelected ? '#1890ff' : (isHovered ? '#40a9ff' : color);
    ctx.fillStyle = (isSelected ? '#1890ff' : (isHovered ? '#40a9ff' : color)) + '33';
    ctx.lineWidth = isSelected ? 3 : (isHovered ? 2.5 : 2);

    ctx.fillRect(left, top, width, height);
    ctx.strokeRect(left, top, width, height);

    // Draw selection handles if selected
    if (isSelected) {
      this.drawSelectionHandles(ctx, left, top, width, height);
    }

    // Draw field name
    ctx.fillStyle = color;
    ctx.font = '11px Arial';
    ctx.fillText(field.name, left + 3, top + 12);

    // Draw recipient label
    ctx.fillText(recipientLabel, left + 3, top + 24);

    // Draw coordinates
    ctx.font = '9px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText(
      `(${field.locations.left?.toFixed?.(0) || 0}, ${field.locations.top?.toFixed?.(0) || 0})`,
      left + 3,
      top + height - 3
    );

    // Draw required indicator
    if (field.required) {
      ctx.fillStyle = '#ff0000';
      ctx.fillText('*', left + width - 10, top + 12);
    }
  }

  /**
   * Draw preview of field being created
   */
  drawFieldPreview(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    currentX: number,
    currentY: number,
    viewport: any,
    documentType: AdobeDocumentType
  ): void {
    // Draw preview rectangle
    ctx.strokeStyle = '#1890ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      startX,
      startY,
      currentX - startX,
      currentY - startY
    );

    // Calculate and display coordinates
    const pixelLeft = Math.min(startX, currentX);
    const pixelTop = Math.min(startY, currentY);
    const pixelWidth = Math.abs(currentX - startX);
    const pixelHeight = Math.abs(currentY - startY);

    const pointsLeft = this.coordService.pixelsToPoints(pixelLeft, viewport.scale);
    const pointsTop = this.coordService.convertYCoordinate(pixelTop, pixelHeight, viewport, documentType);
    const pointsWidth = this.coordService.pixelsToPoints(pixelWidth, viewport.scale);
    const pointsHeight = this.coordService.pixelsToPoints(pixelHeight, viewport.scale);

    ctx.setLineDash([]);
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.fillText(
      `L: ${pointsLeft.toFixed(1)}, T: ${pointsTop.toFixed(1)}, W: ${pointsWidth.toFixed(1)}, H: ${pointsHeight.toFixed(1)}`,
      pixelLeft,
      pixelTop - 5
    );
  }

  /**
   * Check if a point is inside a field's bounds
   */
  isPointInField(
    x: number,
    y: number,
    field: Field,
    viewport: any,
    documentType: AdobeDocumentType
  ): boolean {
    const left = field.locations.left * viewport.scale;
    const width = field.locations.width * viewport.scale;
    const height = field.locations.height * viewport.scale;
    const top = this.coordService.getCanvasPosition(field.locations.top, viewport, documentType);

    return x >= left && x <= left + width && y >= top && y <= top + height;
  }
}
