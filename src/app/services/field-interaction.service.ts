import { Injectable } from '@angular/core';
import { AdobeDocumentType, Field } from '../models/field.model';
import { CoordinateConversionService } from './coordinate-conversion.service';

export interface InteractionState {
  isDragging: boolean;
  isResizing: boolean;
  dragStartPos: { x: number; y: number } | null;
  dragFieldStartPos: { left: number; top: number } | null;
  resizeHandle: string | null;
  resizeStartBounds: { left: number; top: number; width: number; height: number } | null;
}

@Injectable({
  providedIn: 'root'
})
export class FieldInteractionService {
  private state: InteractionState = {
    isDragging: false,
    isResizing: false,
    dragStartPos: null,
    dragFieldStartPos: null,
    resizeHandle: null,
    resizeStartBounds: null
  };

  constructor(private coordService: CoordinateConversionService) {}

  getState(): InteractionState {
    return { ...this.state };
  }

  startDrag(field: Field, x: number, y: number): void {
    this.state.isDragging = true;
    this.state.dragStartPos = { x, y };
    this.state.dragFieldStartPos = {
      left: field.locations.left,
      top: field.locations.top
    };
  }

  startResize(
    field: Field,
    handle: string,
    x: number,
    y: number
  ): void {
    this.state.isResizing = true;
    this.state.resizeHandle = handle;
    this.state.dragStartPos = { x, y };
    this.state.resizeStartBounds = {
      left: field.locations.left,
      top: field.locations.top,
      width: field.locations.width,
      height: field.locations.height
    };
  }

  calculateDragPosition(
    currentX: number,
    currentY: number,
    viewport: any,
    documentType: AdobeDocumentType,
    snapToGrid: boolean,
    gridSize: number
  ): { left: number; top: number } | null {
    if (!this.state.isDragging || !this.state.dragStartPos || !this.state.dragFieldStartPos) {
      return null;
    }

    const deltaX = this.coordService.pixelsToPoints(
      currentX - this.state.dragStartPos.x,
      viewport.scale
    );
    const deltaY = this.coordService.pixelsToPoints(
      currentY - this.state.dragStartPos.y,
      viewport.scale
    );

    const yMultiplier = this.coordService.getYMultiplier(documentType);

    let newLeft = this.state.dragFieldStartPos.left + deltaX;
    let newTop = this.state.dragFieldStartPos.top + deltaY * yMultiplier;

    newLeft = this.coordService.snapToGrid(newLeft, gridSize, snapToGrid);
    newTop = this.coordService.snapToGrid(newTop, gridSize, snapToGrid);

    return { left: newLeft, top: newTop };
  }

  calculateResizeBounds(
    currentX: number,
    currentY: number,
    viewport: any,
    documentType: AdobeDocumentType,
    snapToGrid: boolean,
    gridSize: number,
    minSize: number = 20
  ): { left: number; top: number; width: number; height: number } | null {
    if (!this.state.isResizing || !this.state.dragStartPos || !this.state.resizeStartBounds || !this.state.resizeHandle) {
      return null;
    }

    const deltaX = this.coordService.pixelsToPoints(
      currentX - this.state.dragStartPos.x,
      viewport.scale
    );
    const deltaY = this.coordService.pixelsToPoints(
      currentY - this.state.dragStartPos.y,
      viewport.scale
    );

    let { left, top, width, height } = this.state.resizeStartBounds;
    const yMultiplier = this.coordService.getYMultiplier(documentType);

    switch (this.state.resizeHandle) {
      case 'tl':
        left += deltaX;
        top += deltaY * yMultiplier;
        width -= deltaX;
        height -= deltaY;
        break;
      case 'tr':
        top += deltaY * yMultiplier;
        width += deltaX;
        height -= deltaY;
        break;
      case 'bl':
        left += deltaX;
        width -= deltaX;
        height += deltaY;
        break;
      case 'br':
        width += deltaX;
        height += deltaY;
        break;
      case 't':
        top += deltaY * yMultiplier;
        height -= deltaY;
        break;
      case 'b':
        height += deltaY;
        break;
      case 'l':
        left += deltaX;
        width -= deltaX;
        break;
      case 'r':
        width += deltaX;
        break;
    }

    if (width < minSize) width = minSize;
    if (height < minSize) height = minSize;

    left = this.coordService.snapToGrid(left, gridSize, snapToGrid);
    top = this.coordService.snapToGrid(top, gridSize, snapToGrid);
    width = this.coordService.snapToGrid(width, gridSize, snapToGrid);
    height = this.coordService.snapToGrid(height, gridSize, snapToGrid);

    return { left, top, width, height };
  }

  cancelOperation(): void {
    this.state.isDragging = false;
    this.state.isResizing = false;
    this.state.dragStartPos = null;
    this.state.dragFieldStartPos = null;
    this.state.resizeHandle = null;
    this.state.resizeStartBounds = null;
  }

  completeDrag(): { startPos: { left: number; top: number } } | null {
    if (!this.state.isDragging || !this.state.dragFieldStartPos) {
      return null;
    }

    const startPos = { ...this.state.dragFieldStartPos };
    this.state.isDragging = false;
    this.state.dragStartPos = null;
    this.state.dragFieldStartPos = null;

    return { startPos };
  }

  completeResize(): { startBounds: { left: number; top: number; width: number; height: number } } | null {
    if (!this.state.isResizing || !this.state.resizeStartBounds) {
      return null;
    }

    const startBounds = { ...this.state.resizeStartBounds };
    this.state.isResizing = false;
    this.state.resizeHandle = null;
    this.state.dragStartPos = null;
    this.state.resizeStartBounds = null;

    return { startBounds };
  }

  getResizeHandleAtPoint(
    x: number,
    y: number,
    field: Field,
    viewport: any,
    documentType: AdobeDocumentType
  ): string | null {
    if (!field) return null;

    const left = field.locations.left * viewport.scale;
    const width = field.locations.width * viewport.scale;
    const height = field.locations.height * viewport.scale;
    const top = this.coordService.getCanvasPosition(field.locations.top, viewport, documentType);

    const handleSize = 8;
    const hitMargin = 4;

    const handles = [
      { name: 'tl', x: left, y: top },
      { name: 'tr', x: left + width, y: top },
      { name: 'bl', x: left, y: top + height },
      { name: 'br', x: left + width, y: top + height },
      { name: 't', x: left + width / 2, y: top },
      { name: 'b', x: left + width / 2, y: top + height },
      { name: 'l', x: left, y: top + height / 2 },
      { name: 'r', x: left + width, y: top + height / 2 },
    ];

    for (const handle of handles) {
      const distance = Math.sqrt(
        Math.pow(x - handle.x, 2) + Math.pow(y - handle.y, 2)
      );
      if (distance <= (handleSize / 2 + hitMargin)) {
        return handle.name;
      }
    }

    return null;
  }

  getCursorStyle(
    x: number,
    y: number,
    selectedField: Field | null,
    hoveredField: Field | null,
    viewport: any,
    documentType: AdobeDocumentType
  ): string {
    if (!selectedField) {
      return hoveredField ? 'pointer' : 'default';
    }

    const handle = this.getResizeHandleAtPoint(x, y, selectedField, viewport, documentType);
    if (handle) {
      const cursorMap: { [key: string]: string } = {
        'tl': 'nwse-resize', 'br': 'nwse-resize',
        'tr': 'nesw-resize', 'bl': 'nesw-resize',
        't': 'ns-resize', 'b': 'ns-resize',
        'l': 'ew-resize', 'r': 'ew-resize'
      };
      return cursorMap[handle] || 'default';
    }

    if (hoveredField?.id === selectedField.id) {
      return 'move';
    }

    return hoveredField ? 'pointer' : 'default';
  }
}
