import { Injectable } from '@angular/core';
import { AdobeDocumentType } from '../models/field.model';

@Injectable({
  providedIn: 'root'
})
export class CoordinateConversionService {
  /**
   * Convert canvas pixels to PDF points
   */
  pixelsToPoints(pixels: number, scale: number): number {
    return pixels / scale;
  }

  /**
   * Convert Y coordinate from top-origin to bottom-origin based on document type
   */
  convertYCoordinate(
    y: number,
    height: number,
    viewport: any,
    documentType: AdobeDocumentType
  ): number {
    if (documentType === AdobeDocumentType.LIBRARY) {
      return y / viewport.scale;
    } else {
      const pageHeightInPoints = viewport.viewBox[3] - viewport.viewBox[1];
      const yInPoints = y / viewport.scale;
      return pageHeightInPoints - yInPoints;
    }
  }

  /**
   * Calculate canvas position for a field based on document type
   */
  getCanvasPosition(
    fieldTop: number,
    viewport: any,
    documentType: AdobeDocumentType
  ): number {
    if (documentType === AdobeDocumentType.LIBRARY) {
      return fieldTop * viewport.scale;
    } else {
      const pageHeightInPoints = viewport.viewBox[3] - viewport.viewBox[1];
      const topInPoints = pageHeightInPoints - fieldTop;
      return topInPoints * viewport.scale;
    }
  }

  /**
   * Get Y coordinate multiplier based on document type
   */
  getYMultiplier(documentType: AdobeDocumentType): number {
    return documentType === AdobeDocumentType.LIBRARY ? 1 : -1;
  }

  /**
   * Snap coordinate to grid
   */
  snapToGrid(value: number, gridSize: number, snapEnabled: boolean): number {
    if (!snapEnabled) return value;
    return Math.round(value / gridSize) * gridSize;
  }

  /**
   * Get canvas coordinates from mouse event
   */
  getCanvasCoordinates(
    event: MouseEvent,
    canvasElement: HTMLCanvasElement
  ): { x: number; y: number } {
    const rect = canvasElement.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }
}
