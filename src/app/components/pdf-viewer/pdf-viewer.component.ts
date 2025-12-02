import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMessageService } from 'ng-zorro-antd/message';
import * as pdfjsLib from 'pdfjs-dist';

import { PdfFieldService } from '../../services/pdf-field.service';
import { HistoryService } from '../../services/history.service';
import { CoordinateConversionService } from '../../services/coordinate-conversion.service';
import { FieldInteractionService } from '../../services/field-interaction.service';
import { CanvasRendererService } from '../../services/canvas-renderer.service';
import { FieldTypeService } from '../../services/field-type.service';
import { AdobeDocumentType, Field, FieldTypeCombination, FormFieldContentType, FormFieldInputType } from '../../models/field.model';

// Import new child components
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { FieldTypeSidebarComponent } from '../field-type-sidebar/field-type-sidebar.component';
import { FieldPropertiesSidebarComponent } from '../field-properties-sidebar/field-properties-sidebar.component';

(pdfjsLib as any).GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.3.31/pdf.worker.mjs`;

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzUploadModule,
    NzIconModule,
    NzDividerModule,
    NzSelectModule,
    NzSpaceModule,
    NzToolTipModule,
    NzModalModule,
    NzLayoutModule,
    NzCardModule,
    NzAlertModule,
    NzBadgeModule,
    NzTagModule,
    NzListModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSwitchModule,
    NzEmptyModule,
    NzCheckboxModule,
    // New child components
    ToolbarComponent,
    FieldTypeSidebarComponent,
    FieldPropertiesSidebarComponent
  ],
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.less']
})
export class PdfViewerComponent implements OnInit {
  @ViewChild('pdfCanvas', { static: false }) pdfCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('drawingCanvas', { static: false }) drawingCanvas!: ElementRef<HTMLCanvasElement>;

  // PDF state
  pdfDocument: any = null;
  currentPage = 1;
  totalPages = 0;
  scale = 1.5;

  // Drawing state
  isDrawing = false;
  showGrid = false;
  drawingStart: { x: number; y: number } | null = null;

  // Field state
  selectedField: Field | null = null;
  hoveredField: Field | null = null;
  fields: Field[] = [];

  // Interaction settings
  snapToGrid = false;
  gridSize = 10;

  // UI state
  canUndo = false;
  canRedo = false;
  selectedFieldType: any = 'TEXT_FIELD';
  recipientIndex = 1;
  documentType: AdobeDocumentType = AdobeDocumentType.TRANSIENT;
  leftSidebarCollapsed = false;
  rightSidebarCollapsed = false;
  searchFieldType = '';

  // Field type configuration
  fieldTypeCombinations: any[] = [];
  fieldTypeGroups: any[] = [];
  FormFieldInputType = FormFieldInputType;

  private renderTask: any = null;
  private isRendering = false;

  constructor(
    private pdfFieldService: PdfFieldService,
    public historyService: HistoryService,
    private modal: NzModalService,
    private message: NzMessageService,
    private coordService: CoordinateConversionService,
    private interactionService: FieldInteractionService,
    private canvasRenderer: CanvasRendererService,
    public fieldTypeService: FieldTypeService
  ) {
    this.fieldTypeCombinations = this.fieldTypeService.getFieldTypeCombinations();
    this.fieldTypeGroups = this.fieldTypeService.getFieldTypeGroups();

    // Set default selected field type to the first item
    const defaultField = this.fieldTypeGroups[0]?.items[0];
    if (defaultField) {
      this.selectedFieldType = `${defaultField.label}_${defaultField.inputType}_${defaultField.contentType}`.toLowerCase();
    }
  }

  ngOnInit(): void {
    this.initializeSubscriptions();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    this.handleKeyboardShortcuts(event);
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.pdfDocument && this.currentPage) {
      this.renderPage(this.currentPage);
    }
  }

  // ==================== Initialization ====================

  private initializeSubscriptions(): void {
    this.pdfFieldService.pdfDocument$.subscribe(async (pdfDoc) => {
      if (pdfDoc) {
        this.pdfDocument = pdfDoc;
        this.totalPages = pdfDoc.numPages;
        this.currentPage = 1;
        await this.renderPage(this.currentPage);
      }
    });

    this.pdfFieldService.fields$.subscribe(fields => {
      this.fields = fields;
      this.redrawOverlay();
    });

    this.historyService.canUndo$.subscribe(canUndo => this.canUndo = canUndo);
    this.historyService.canRedo$.subscribe(canRedo => this.canRedo = canRedo);
  }

  // ==================== Keyboard Shortcuts ====================

  private handleKeyboardShortcuts(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.historyService.undo();
      this.selectedField = null;
      this.redrawOverlay();
      return;
    }

    if ((event.ctrlKey && event.shiftKey && event.key === 'Z') || (event.ctrlKey && event.key === 'y')) {
      event.preventDefault();
      this.historyService.redo();
      this.selectedField = null;
      this.redrawOverlay();
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (this.selectedField && !this.isDrawing) {
        event.preventDefault();
        this.pdfFieldService.deleteField(this.selectedField.id);
        this.selectedField = null;
        this.redrawOverlay();
      }
      return;
    }

    if (event.key === 'Escape') {
      if (this.interactionService.getState().isDragging || this.interactionService.getState().isResizing) {
        this.interactionService.cancelOperation();
        this.redrawOverlay();
      } else if (this.selectedField) {
        this.selectedField = null;
        this.redrawOverlay();
      }
      return;
    }
  }

  // ==================== PDF Loading & Rendering ====================

  beforeUpload = (file: any) => {
    const nativeFile: File = file.originFileObj || file;
    if (nativeFile.type !== 'application/pdf') {
      return false;
    }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.loadPdf(e.target.result);
    };
    reader.readAsArrayBuffer(nativeFile);
    return false;
  };

  async onFileSelected(event: any): Promise<void> {
    const file = event.file || event.target?.files?.[0];
    if (file && file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      await this.loadPdf(arrayBuffer);
    }
  }

  async loadPdf(arrayBuffer: ArrayBuffer): Promise<void> {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    this.pdfDocument = await loadingTask.promise;
    this.totalPages = this.pdfDocument.numPages;
    this.currentPage = 1;
    this.pdfFieldService.setPdfDocument(this.pdfDocument);

    setTimeout(() => {
      this.renderPage(this.currentPage);
    }, 100);
  }

  async renderPage(pageNumber: number): Promise<void> {
    if (!this.pdfDocument || !this.pdfCanvas) return;

    if (this.renderTask) {
      try {
        await this.renderTask.cancel();
      } catch (error) {
        // Silently ignore cancellation errors
      }
      this.renderTask = null;
    }

    if (this.isRendering) return;

    try {
      this.isRendering = true;

      const page = await this.pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: this.scale });

      const canvas = this.pdfCanvas.nativeElement;
      const context = canvas.getContext('2d')!;

      this.canvasRenderer.clearCanvas(canvas);

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (this.drawingCanvas) {
        const drawCanvas = this.drawingCanvas.nativeElement;
        drawCanvas.height = viewport.height;
        drawCanvas.width = viewport.width;
      }

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      this.renderTask = page.render(renderContext);
      await this.renderTask.promise;

      this.renderTask = null;

      this.pdfFieldService.setCurrentPage(pageNumber);
      this.pdfFieldService.setCurrentViewport(viewport);
      this.redrawOverlay();
    } catch (error) {
      if ((error as any).name !== 'RenderingCancelledException') {
        console.error('Error rendering page:', error);
      }
    } finally {
      this.isRendering = false;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.renderPage(this.currentPage);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.renderPage(this.currentPage);
    }
  }

  // ==================== Mouse Event Handlers ====================

  onMouseDown(event: MouseEvent): void {
    const coords = this.coordService.getCanvasCoordinates(event, this.drawingCanvas.nativeElement);
    const viewport = this.getCurrentViewport();
    if (!viewport) return;

    // First, check if clicking on a resize handle of the selected field
    if (this.selectedField) {
      const handle = this.interactionService.getResizeHandleAtPoint(
        coords.x,
        coords.y,
        this.selectedField,
        viewport,
        this.documentType
      );

      if (handle) {
        this.interactionService.startResize(this.selectedField, handle, coords.x, coords.y);
        return;
      }
    }

    // Second, check if clicking on an existing field
    const fieldAtPoint = this.getFieldAtPoint(coords.x, coords.y);

    if (fieldAtPoint) {
      // Clicking on a field - select it and allow dragging
      if (this.selectedField?.id !== fieldAtPoint.id) {
        this.selectedField = fieldAtPoint;
        this.redrawOverlay();
      }
      this.interactionService.startDrag(fieldAtPoint, coords.x, coords.y);
    } else {
      // Clicking on empty canvas - start drawing if a field type is selected
      if (this.selectedFieldType && this.getSelectedFieldType()) {
        this.drawingStart = coords;
        this.isDrawing = true;
      }
      this.selectedField = null;
      this.redrawOverlay();
    }
  }

  onMouseMove(event: MouseEvent): void {
    const coords = this.coordService.getCanvasCoordinates(event, this.drawingCanvas.nativeElement);
    const viewport = this.getCurrentViewport();
    if (!viewport) return;

    const state = this.interactionService.getState();

    if (state.isDragging && this.selectedField) {
      this.handleDragMove(coords, viewport);
      return;
    }

    if (state.isResizing && this.selectedField) {
      this.handleResizeMove(coords, viewport);
      return;
    }

    if (this.isDrawing && this.drawingStart) {
      this.handleDrawingMove(coords, viewport);
      return;
    }

    this.updateHoverState(coords, viewport);
    this.updateCursor(coords.x, coords.y, viewport);
  }

  onMouseUp(event: MouseEvent): void {
    const coords = this.coordService.getCanvasCoordinates(event, this.drawingCanvas.nativeElement);
    const state = this.interactionService.getState();

    if (state.isDragging && this.selectedField) {
      this.completeDragOperation();
      this.updateCursorAfterOperation(coords.x, coords.y);
      return;
    }

    if (state.isResizing && this.selectedField) {
      this.completeResizeOperation();
      this.updateCursorAfterOperation(coords.x, coords.y);
      return;
    }

    if (this.isDrawing && this.drawingStart) {
      this.completeFieldCreation(coords);
      this.isDrawing = false; // Reset drawing state after field creation
    }
  }

  // ==================== Interaction Handlers ====================

  private handleDragMove(coords: { x: number; y: number }, viewport: any): void {
    const newPosition = this.interactionService.calculateDragPosition(
      coords.x,
      coords.y,
      viewport,
      this.documentType,
      this.snapToGrid,
      this.gridSize
    );

    if (newPosition && this.selectedField) {
      this.pdfFieldService.moveField(this.selectedField.id, newPosition.left, newPosition.top, false);
    }
  }

  private handleResizeMove(coords: { x: number; y: number }, viewport: any): void {
    const newBounds = this.interactionService.calculateResizeBounds(
      coords.x,
      coords.y,
      viewport,
      this.documentType,
      this.snapToGrid,
      this.gridSize
    );

    if (newBounds && this.selectedField) {
      this.pdfFieldService.resizeField(
        this.selectedField.id,
        newBounds.left,
        newBounds.top,
        newBounds.width,
        newBounds.height,
        false
      );
    }
  }

  private handleDrawingMove(coords: { x: number; y: number }, viewport: any): void {
    if (!this.drawingStart) return;

    const ctx = this.drawingCanvas.nativeElement.getContext('2d')!;
    this.redrawOverlay();

    this.canvasRenderer.drawFieldPreview(
      ctx,
      this.drawingStart.x,
      this.drawingStart.y,
      coords.x,
      coords.y,
      viewport,
      this.documentType
    );
  }

  private completeDragOperation(): void {
    const result = this.interactionService.completeDrag();
    if (!result || !this.selectedField) return;

    const fieldId = this.selectedField.id;
    const currentField = this.fields.find(f => f.id === fieldId);

    if (currentField) {
      if (currentField.locations.left !== result.startPos.left ||
        currentField.locations.top !== result.startPos.top) {
        this.pdfFieldService.moveField(
          currentField.id,
          currentField.locations.left,
          currentField.locations.top,
          true,
          result.startPos.left,
          result.startPos.top
        );
      }
    }

    this.selectedField = this.fields.find(f => f.id === fieldId) || null;
    this.redrawOverlay();
  }

  private completeResizeOperation(): void {
    const result = this.interactionService.completeResize();
    if (!result || !this.selectedField) return;

    const fieldId = this.selectedField.id;
    const currentField = this.fields.find(f => f.id === fieldId);

    if (currentField) {
      const bounds = result.startBounds;
      if (currentField.locations.left !== bounds.left ||
        currentField.locations.top !== bounds.top ||
        currentField.locations.width !== bounds.width ||
        currentField.locations.height !== bounds.height) {
        this.pdfFieldService.resizeField(
          currentField.id,
          currentField.locations.left,
          currentField.locations.top,
          currentField.locations.width,
          currentField.locations.height,
          true,

          bounds
        );
      }
    }

    this.selectedField = this.fields.find(f => f.id === fieldId) || null;
    this.redrawOverlay();
  }

  private completeFieldCreation(coords: { x: number; y: number }): void {
    if (!this.drawingStart) return;

    const viewport = this.getCurrentViewport();
    if (!viewport) return;

    const selectedType = this.getSelectedFieldType();
    if (!selectedType) return;

    const pixelLeft = Math.min(this.drawingStart.x, coords.x);
    const pixelTop = Math.min(this.drawingStart.y, coords.y);
    const pixelWidth = Math.abs(coords.x - this.drawingStart.x);
    const pixelHeight = Math.abs(coords.y - this.drawingStart.y);

    const pointsLeft = this.coordService.pixelsToPoints(pixelLeft, viewport.scale);
    const pointsWidth = this.coordService.pixelsToPoints(pixelWidth, viewport.scale);
    const pointsHeight = this.coordService.pixelsToPoints(pixelHeight, viewport.scale);
    const pointsTop = this.coordService.convertYCoordinate(pixelTop, pixelHeight, viewport, this.documentType);

    const field: Field = {
      id: `field_${Date.now()}`,
      name: this.fieldTypeService.generateSmartFieldName(
        selectedType.inputType,
        selectedType.contentType ?? FormFieldContentType.DATA,
        this.fields
      ),
      inputType: selectedType.inputType,
      contentType: selectedType.contentType ?? FormFieldContentType.DATA,
      readOnly: selectedType.readOnly,
      required: false,
      validation: selectedType.validation,
      validationData: selectedType.validationData,
      locations: {
        pageNumber: this.currentPage,
        left: Number(pointsLeft) || 0,
        top: Number(pointsTop) || 0,
        width: Number(pointsWidth) || 0,
        height: Number(pointsHeight) || 0
      },
      recipientIndex: this.recipientIndex,
    };

    this.pdfFieldService.addField(field);
    this.drawingStart = null;
    // Keep drawing mode active for continuous field creation
  }

  // ==================== Canvas Rendering ====================

  redrawOverlay(): void {
    if (!this.drawingCanvas) return;

    const canvas = this.drawingCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.canvasRenderer.clearCanvas(canvas);

    const viewport = this.getCurrentViewport();
    if (!viewport) return;

    if (this.showGrid) {
      this.canvasRenderer.drawGrid(ctx, viewport, this.documentType);
    }

    this.fields
      .filter(field => field.locations.pageNumber === this.currentPage)
      .forEach(field => {
        const color = this.fieldTypeService.getFieldColor(field);
        const isSelected = this.selectedField?.id === field.id;
        const isHovered = this.hoveredField?.id === field.id;
        const recipientLabel = this.getRecipientLabel(field.recipientIndex);

        this.canvasRenderer.drawField(
          ctx,
          field,
          viewport,
          this.documentType,
          color,
          isSelected,
          isHovered,
          recipientLabel
        );
      });
  }

  // ==================== Helper Methods ====================

  private getCurrentViewport(): any {
    let viewport: any = null;
    this.pdfFieldService.currentViewport$.subscribe(vp => viewport = vp).unsubscribe();
    return viewport;
  }

  private getFieldAtPoint(x: number, y: number): Field | null {
    const viewport = this.getCurrentViewport();
    if (!viewport) return null;

    const fieldsOnPage = this.fields
      .filter(field => field.locations.pageNumber === this.currentPage)
      .reverse();

    for (const field of fieldsOnPage) {
      if (this.canvasRenderer.isPointInField(x, y, field, viewport, this.documentType)) {
        return field;
      }
    }

    return null;
  }

  private updateHoverState(coords: { x: number; y: number }, viewport: any): void {
    const fieldAtPoint = this.getFieldAtPoint(coords.x, coords.y);
    if (fieldAtPoint !== this.hoveredField) {
      this.hoveredField = fieldAtPoint;
      this.redrawOverlay();
    }
  }

  private updateCursor(x: number, y: number, viewport: any): void {
    const cursor = this.interactionService.getCursorStyle(
      x,
      y,
      this.selectedField,
      this.hoveredField,
      viewport,
      this.documentType
    );
    this.drawingCanvas.nativeElement.style.cursor = cursor;
  }

  private updateCursorAfterOperation(x: number, y: number): void {
    const viewport = this.getCurrentViewport();
    if (viewport) {
      this.updateCursor(x, y, viewport);
    }
  }

  // ==================== Public UI Methods ====================

  getRecipientLabel(index: number): string {
    return this.pdfFieldService.getRecipientTypeName(index);
  }

  getSelectedFieldType() {
    return this.fieldTypeService.getFieldTypeByKey(this.selectedFieldType);
  }

  changeDocumentType(type: AdobeDocumentType): void {
    this.modal.create({
      nzTitle: 'Change Document Type - Field Remapping Required',
      nzContent: `
        <p><strong>Changing the document type will remap all field coordinates.</strong></p>
        <p>Adobe Sign uses different coordinate systems:</p>
        <ul style="margin: 10px 0;">
          <li><strong>TRANSIENT:</strong> Origin at bottom-left (0,0)</li>
          <li><strong>LIBRARY:</strong> Origin at top-left (0,0)</li>
        </ul>
        <p>All your fields will be automatically repositioned to maintain their visual placement in the new coordinate system. The Y-coordinates will be recalculated.</p>
        <p style="color: #ff4d4f; margin-top: 10px;">
          <strong>Note:</strong> This affects the exported JSON values. Please verify field positions after the change.
        </p>
      `,
      nzClosable: true,
      nzOkText: 'Continue with Remapping',
      nzOkType: 'primary',
      nzCancelText: 'Cancel',
      nzOnOk: () => {
        this.documentType = type;
        this.redrawOverlay();
      },
      nzWidth: 520,
      nzMaskClosable: false,
      nzIconType: 'exclamation-circle'
    });
  }

  get fieldsOnCurrentPage(): Field[] {
    return this.fields.filter(f => f.locations.pageNumber === this.currentPage);
  }

  selectFieldType(field: FieldTypeCombination): void {
    this.selectedFieldType = `${field.label}_${field.inputType}_${field.contentType}`.toLowerCase();
  }

  deleteSelectedField(): void {
    if (this.selectedField) {
      this.pdfFieldService.deleteField(this.selectedField.id);
      this.selectedField = null;
      this.redrawOverlay();
    }
  }

  // ==================== Import/Export/JSON ====================

  exportJson(): void {
    const fieldsData = {
      fields: this.fields,
      documentType: this.documentType,
      totalPages: this.totalPages,
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(fieldsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fieldforge-config-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    this.message.success('Configuration exported successfully!');
  }

  importJson(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          try {
            const config = JSON.parse(e.target.result);

            if (config.fields && Array.isArray(config.fields)) {
              // Clear existing fields
              this.fields.forEach(f => this.pdfFieldService.deleteField(f.id));

              // Import new fields
              config.fields.forEach((field: Field) => {
                this.pdfFieldService.addField(field);
              });

              if (config.documentType) {
                this.documentType = config.documentType;
              }

              this.redrawOverlay();
              this.message.success(`Imported ${config.fields.length} fields successfully!`);
            } else {
              this.message.error('Invalid configuration file format!');
            }
          } catch (error) {
            this.message.error('Failed to parse JSON file!');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  showJson(): void {
    const fieldsData = {
      fields: this.fields,
      documentType: this.documentType,
      totalPages: this.totalPages,
      currentPage: this.currentPage
    };

    const jsonString = JSON.stringify(fieldsData, null, 2);

    this.modal.create({
      nzTitle: 'Field Configuration JSON',
      nzContent: `<pre style="max-height: 500px; overflow: auto; background: #f5f5f5; padding: 16px; border-radius: 4px;"><code>${this.escapeHtml(jsonString)}</code></pre>`,
      nzWidth: 800,
      nzFooter: [
        {
          label: 'Copy to Clipboard',
          type: 'primary',
          onClick: () => {
            navigator.clipboard.writeText(jsonString).then(() => {
              this.message.success('JSON copied to clipboard!');
            });
          }
        },
        {
          label: 'Close',
          onClick: () => true
        }
      ]
    });
  }

  // ==================== Child Component Event Handlers ====================

  async onToolbarFileSelected(file: File): Promise<void> {
    if (file && file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      await this.loadPdf(arrayBuffer);
    }
  }

  onToolbarImportClicked(): void {
    this.importJson();
  }

  onToolbarExportClicked(): void {
    this.exportJson();
  }

  onToolbarJsonViewClicked(): void {
    this.showJson();
  }

  onToolbarPageChanged(page: number): void {
    this.currentPage = page;
    this.renderPage(page);
  }

  onToolbarGridToggled(show: boolean): void {
    this.showGrid = show;
    this.redrawOverlay();
  }

  onToolbarSnapToggled(snap: boolean): void {
    this.snapToGrid = snap;
  }

  onToolbarUndoClicked(): void {
    this.historyService.undo();
  }

  onToolbarRedoClicked(): void {
    this.historyService.redo();
  }

  onToolbarDocumentTypeChanged(type: AdobeDocumentType): void {
    this.changeDocumentType(type);
  }

  onToolbarLeftSidebarToggled(collapsed: boolean): void {
    this.leftSidebarCollapsed = collapsed;
  }

  onToolbarRightSidebarToggled(collapsed: boolean): void {
    this.rightSidebarCollapsed = collapsed;
  }

  onFieldListFieldSelected(field: Field): void {
    this.selectedField = field;
    this.redrawOverlay();
  }

  onFieldPropertyUpdated(updates: Partial<Field>): void {
    if (this.selectedField) {
      this.pdfFieldService.updateField(this.selectedField.id, updates);
      this.redrawOverlay();
    }
  }

  onFieldPropertyDeleted(): void {
    this.deleteSelectedField();
  }

  onFieldTypeSidebarFieldTypeSelected(fieldType: FieldTypeCombination): void {
    this.selectFieldType(fieldType);
  }

  onFieldTypeSidebarFieldSelected(field: Field): void {
    this.selectedField = field;
    this.redrawOverlay();
  }

  onFieldPropertiesSidebarFieldUpdated(updates: Partial<Field>): void {
    if (this.selectedField) {
      this.pdfFieldService.updateField(this.selectedField.id, updates);
      this.redrawOverlay();
    }
  }

  onFieldPropertiesSidebarFieldDeleted(): void {
    this.deleteSelectedField();
  }

  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}
