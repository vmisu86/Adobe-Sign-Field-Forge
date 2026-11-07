import { Injectable } from '@angular/core';
import { AdobeDocumentType, Point } from '../models/field.model';
import { ViewportGeometry } from '../models/pdf.types';

/**
 * Maps between canvas pixels and the PDF-point coordinates stored on a field.
 *
 * A field's `top` is always the distance of its TOP EDGE from an origin edge of the page, in PDF
 * points (1/72 inch). Which edge depends on the Adobe Sign document type:
 *  - TRANSIENT: the bottom of the page (bottom-left origin, like PDF itself)
 *  - LIBRARY:   the top of the page (top-left origin)
 * `left`, `width` and `height` do not depend on the document type.
 */
@Injectable({
  providedIn: 'root',
})
export class CoordinateConversionService {
  /** Convert canvas pixels to PDF points. */
  pixelsToPoints(pixels: number, scale: number): number {
    return pixels / scale;
  }

  /** Height of the page in PDF points. */
  pageHeightPoints(viewport: ViewportGeometry): number {
    return viewport.viewBox[3] - viewport.viewBox[1];
  }

  /** Convert a canvas Y (measured from the top of the canvas) into a stored `top`. */
  convertYCoordinate(pixelY: number, viewport: ViewportGeometry, documentType: AdobeDocumentType): number {
    const yInPoints = pixelY / viewport.scale;
    return documentType === AdobeDocumentType.LIBRARY ? yInPoints : this.pageHeightPoints(viewport) - yInPoints;
  }

  /** Convert a stored `top` into a canvas Y (measured from the top of the canvas). */
  getCanvasPosition(fieldTop: number, viewport: ViewportGeometry, documentType: AdobeDocumentType): number {
    const fromCanvasTop =
      documentType === AdobeDocumentType.LIBRARY ? fieldTop : this.pageHeightPoints(viewport) - fieldTop;
    return fromCanvasTop * viewport.scale;
  }

  /**
   * Re-express a stored `top` in the other document type's coordinate system, keeping the field
   * where it is on the page. The mapping is its own inverse.
   */
  flipTop(top: number, pageHeightPoints: number): number {
    return pageHeightPoints - top;
  }

  /** +1 when moving down the page increases `top`, -1 when it decreases it. */
  getYMultiplier(documentType: AdobeDocumentType): number {
    return documentType === AdobeDocumentType.LIBRARY ? 1 : -1;
  }

  snapToGrid(value: number, gridSize: number, snapEnabled: boolean): number {
    if (!snapEnabled) return value;
    return Math.round(value / gridSize) * gridSize;
  }

  /** Mouse position relative to the canvas box. */
  getCanvasCoordinates(event: MouseEvent, canvasElement: HTMLCanvasElement): Point {
    const rect = canvasElement.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }
}
