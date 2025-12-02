import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { AdobeDocumentType } from '../../models/field.model';

@Component({
  selector: 'app-toolbar',
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
    NzLayoutModule
  ],
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.less']
})
export class ToolbarComponent {
  // Inputs
  @Input() canUndo = false;
  @Input() canRedo = false;
  @Input() currentPage = 1;
  @Input() totalPages = 0;
  @Input() showGrid = false;
  @Input() snapToGrid = false;
  @Input() documentType: AdobeDocumentType = AdobeDocumentType.TRANSIENT;
  @Input() leftSidebarCollapsed = false;
  @Input() rightSidebarCollapsed = false;

  // Outputs
  @Output() fileSelected = new EventEmitter<File>();
  @Output() importClicked = new EventEmitter<void>();
  @Output() exportClicked = new EventEmitter<void>();
  @Output() jsonViewClicked = new EventEmitter<void>();
  @Output() pageChanged = new EventEmitter<number>();
  @Output() gridToggled = new EventEmitter<boolean>();
  @Output() snapToggled = new EventEmitter<boolean>();
  @Output() undoClicked = new EventEmitter<void>();
  @Output() redoClicked = new EventEmitter<void>();
  @Output() documentTypeChanged = new EventEmitter<AdobeDocumentType>();
  @Output() leftSidebarToggled = new EventEmitter<boolean>();
  @Output() rightSidebarToggled = new EventEmitter<boolean>();

  // File upload handler
  beforeUpload = (file: any): boolean => {
    // Convert NzUploadFile to native File
    const nativeFile = (file as any).originFileObj || file;
    this.fileSelected.emit(nativeFile);
    return false; // Prevent automatic upload
  };

  onFileChange(event: any): void {
    const nzFile = event?.file;
    if (nzFile) {
      const nativeFile = (nzFile as any).originFileObj || nzFile;
      this.fileSelected.emit(nativeFile);
    }
  }

  onPreviousPage(): void {
    if (this.currentPage > 1) {
      this.pageChanged.emit(this.currentPage - 1);
    }
  }

  onNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.pageChanged.emit(this.currentPage + 1);
    }
  }

  onGridToggle(): void {
    this.gridToggled.emit(!this.showGrid);
  }

  onSnapToggle(): void {
    this.snapToggled.emit(!this.snapToGrid);
  }

  onDocumentTypeChange(type: AdobeDocumentType): void {
    this.documentTypeChanged.emit(type);
  }

  onLeftSidebarToggle(): void {
    this.leftSidebarToggled.emit(!this.leftSidebarCollapsed);
  }

  onRightSidebarToggle(): void {
    this.rightSidebarToggled.emit(!this.rightSidebarCollapsed);
  }
}
