import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AdobeDocumentType, Field, IFormFieldGeneratorViewModel } from '../models/field.model';
import { HistoryService, AddFieldCommand, DeleteFieldCommand, UpdateFieldCommand, MoveFieldCommand, ResizeFieldCommand } from './history.service';

@Injectable({
  providedIn: 'root'
})
export class PdfFieldService {
  private fieldsSubject = new BehaviorSubject<Field[]>([]);
  fields$: Observable<Field[]> = this.fieldsSubject.asObservable();

  private pdfDocumentSubject = new BehaviorSubject<any>(null);
  pdfDocument$: Observable<any> = this.pdfDocumentSubject.asObservable();

  private currentPageSubject = new BehaviorSubject<number>(1);
  currentPage$: Observable<number> = this.currentPageSubject.asObservable();

  private currentViewportSubject = new BehaviorSubject<any>(null);
  currentViewport$: Observable<any> = this.currentViewportSubject.asObservable();

  constructor(private historyService: HistoryService) { }

  setPdfDocument(doc: any): void {
    this.pdfDocumentSubject.next(doc);
  }

  setCurrentPage(page: number): void {
    this.currentPageSubject.next(page);
  }

  setCurrentViewport(viewport: any): void {
    this.currentViewportSubject.next(viewport);
  }

  // Convert canvas pixels to PDF points
   pixelsToPoints(pixels: number, scale: number): number {
    return pixels / scale;
  }
  // Convert Y coordinate from top-origin to bottom-origin
  convertYCoordinate(y: number, height: number, viewport: any, documentType: AdobeDocumentType): number {
    if (documentType === AdobeDocumentType.LIBRARY) {
      // For LIBRARY type, use direct coordinate (0-based from top)
      return y / viewport.scale;
    } else {
      // For TRANSIENT type, use bottom-origin coordinate system
      const pageHeightInPoints = viewport.viewBox[3] - viewport.viewBox[1];
      const yInPoints = y / viewport.scale;
      return pageHeightInPoints - yInPoints;
    }
  }

  addField(field: Field, useHistory: boolean = true): void {
    if (useHistory) {
      const command = new AddFieldCommand(
        field,
        (f) => this.addFieldInternal(f),
        (id) => this.deleteFieldInternal(id)
      );
      this.historyService.executeCommand(command);
    } else {
      this.addFieldInternal(field);
    }
  }

  private addFieldInternal(field: Field): void {
    const currentFields = this.fieldsSubject.value;
    this.fieldsSubject.next([...currentFields, field]);
  }

  updateField(id: string, updates: Partial<Field>, useHistory: boolean = true): void {
    const currentFields = this.fieldsSubject.value;
    const oldField = currentFields.find(f => f.id === id);

    if (!oldField) return;

    const newField = { ...oldField, ...updates };

    if (useHistory) {
      const command = new UpdateFieldCommand(
        oldField,
        newField,
        (f) => this.updateFieldInternal(f)
      );
      this.historyService.executeCommand(command);
    } else {
      this.updateFieldInternal(newField);
    }
  }

  private updateFieldInternal(field: Field): void {
    const currentFields = this.fieldsSubject.value;
    const updatedFields = currentFields.map(f =>
      f.id === field.id ? field : f
    );
    this.fieldsSubject.next(updatedFields);
  }

  deleteField(id: string, useHistory: boolean = true): void {
    const currentFields = this.fieldsSubject.value;
    const field = currentFields.find(f => f.id === id);

    if (!field) return;

    if (useHistory) {
      const command = new DeleteFieldCommand(
        field,
        (fieldId) => this.deleteFieldInternal(fieldId),
        (f) => this.addFieldInternal(f)
      );
      this.historyService.executeCommand(command);
    } else {
      this.deleteFieldInternal(id);
    }
  }

  private deleteFieldInternal(id: string): void {
    const currentFields = this.fieldsSubject.value;
    this.fieldsSubject.next(currentFields.filter(field => field.id !== id));
  }

  /**
   * Move a field to a new position
   */
  moveField(id: string, newLeft: number, newTop: number, useHistory: boolean = true, oldLeft?: number, oldTop?: number): void {
    const field = this.fieldsSubject.value.find(f => f.id === id);
    if (!field) return;

    if (useHistory) {
      const originalLeft = oldLeft ?? field.locations.left;
      const originalTop = oldTop ?? field.locations.top;

      if (originalLeft === newLeft && originalTop === newTop) return;

      const command = new MoveFieldCommand(
        id,
        originalLeft,
        originalTop,
        newLeft,
        newTop,
        (fieldId, left, top) => this.moveFieldInternal(fieldId, left, top)
      );
      this.historyService.executeCommand(command);
    } else {
      this.moveFieldInternal(id, newLeft, newTop);
    }
  }

  private moveFieldInternal(id: string, left: number, top: number): void {
    const currentFields = this.fieldsSubject.value;
    const updatedFields = currentFields.map(field =>
      field.id === id
        ? { ...field, locations: { ...field.locations, left, top } }
        : field
    );
    this.fieldsSubject.next(updatedFields);
  }

  /**
   * Resize a field
   */
  resizeField(id: string, newLeft: number, newTop: number, newWidth: number, newHeight: number, useHistory: boolean = true, oldBounds?: { left: number, top: number, width: number, height: number }): void {
    const field = this.fieldsSubject.value.find(f => f.id === id);
    if (!field) return;
    
    if (useHistory) {
      const originalBounds = oldBounds ?? field.locations;

      if (originalBounds.left === newLeft && originalBounds.top === newTop && originalBounds.width === newWidth && originalBounds.height === newHeight) return;

      const command = new ResizeFieldCommand(
        id,
        originalBounds.left,
        originalBounds.top,
        originalBounds.width,
        originalBounds.height,
        newLeft,
        newTop,
        newWidth,
        newHeight,
        (fieldId, left, top, width, height) => this.resizeFieldInternal(fieldId, left, top, width, height)
      );
      this.historyService.executeCommand(command);
    } else {
      this.resizeFieldInternal(id, newLeft, newTop, newWidth, newHeight);
    }
  }

  private resizeFieldInternal(id: string, left: number, top: number, width: number, height: number): void {
    const currentFields = this.fieldsSubject.value;
    const updatedFields = currentFields.map(field =>
      field.id === id
        ? { ...field, locations: { ...field.locations, left, top, width, height } }
        : field
    );
    this.fieldsSubject.next(updatedFields);
  }

  getFields(): Field[] {
    return this.fieldsSubject.value;
  }

  // Convert to backend ViewModel format
  exportToViewModelFormat(): IFormFieldGeneratorViewModel[] {
    return this.fieldsSubject.value.map(field => ({
      name: field.name,
      inputType: field.inputType,
      contentType: field.contentType,
      required: field.required,
      validation: field.validation,
      validationData: field.validationData,
      locations: [
        {
          pageNumber: field.locations.pageNumber,
          left: Number(field.locations.left),
          top: Number(field.locations.top),
          width: Number(field.locations.width),
          height: Number(field.locations.height)
        }
      ],
      recipientIndex: field.recipientIndex,
      readOnly: field.readOnly
    }));
  }
  

  // Import fields from backend format
  importFromViewModelFormat(viewModels: any[]): void {
    const fields: Field[] = viewModels.map((vm, index) => {
      const location = Array.isArray(vm.locations) ? vm.locations[0] : vm.locations;
      
      return {
        id: `field_${Date.now()}_${index}`,
        name: vm.name,
        inputType: vm.inputType,
        contentType: vm.contentType,
        required: vm.required,
        recipientIndex: 1, 
        validation: vm.validation || '',
        validationData: vm.validationData || '',
        readOnly: vm.readOnly || false,
        locations: {
          pageNumber: Number(location.pageNumber),
          left: Number(location.left),
          top: Number(location.top),
          width: Number(location.width),
          height: Number(location.height)
        }
      };
    });
  
    this.fieldsSubject.next(fields);
  }
  // Helper to get recipient type name
  getRecipientTypeName(index: number): string {
    switch (index) {
      case 1: return 'SIGNER';
      case 2: return 'APPROVER';
      default: return 'UNKNOWN';
    }
  }
}