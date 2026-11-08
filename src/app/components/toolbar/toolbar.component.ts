import { ChangeDetectionStrategy, Component, computed, effect, inject, untracked, viewChild } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { AdobeDocumentType } from '../../models/field.model';
import { EditorStateService } from '../../services/editor-state.service';
import { FieldEditorService } from '../../services/field-editor.service';
import { FileActionsService } from '../../services/file-actions.service';
import { HistoryService } from '../../services/history.service';
import { PdfDocumentService } from '../../services/pdf-document.service';
import { ZOOM_STEPS } from '../../utils/zoom';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzButtonModule, NzIconModule, NzSelectModule, NzToolTipModule],
  templateUrl: './toolbar.component.html',
})
export class ToolbarComponent {
  protected readonly state = inject(EditorStateService);
  protected readonly history = inject(HistoryService);
  protected readonly pdf = inject(PdfDocumentService);
  protected readonly actions = inject(FileActionsService);
  protected readonly editor = inject(FieldEditorService);
  protected readonly DocumentType = AdobeDocumentType;
  protected readonly zoomSteps = ZOOM_STEPS;

  /** What the zoom select shows: 'fit' while following the window, else the chosen step. */
  protected readonly zoomValue = computed<'fit' | number>(() => {
    if (this.pdf.zoomMode() === 'fit-width') return 'fit';
    const scale = this.pdf.scale();
    return ZOOM_STEPS.find((step) => Math.abs(step - scale) < 0.001) ?? 'fit';
  });

  private readonly documentTypeModel = viewChild<NgModel>('documentTypeModel');

  constructor() {
    // A cancelled document-type change leaves the select showing the value the user clicked;
    // push the real one back into it.
    effect(() => {
      const resyncs = this.state.documentTypeResync();
      const model = this.documentTypeModel();
      if (resyncs > 0 && model) {
        untracked(() => model.control.setValue(this.state.documentType()));
      }
    });
  }

  protected onZoomSelect(value: 'fit' | number): void {
    if (value === 'fit') {
      this.pdf.fitWidth();
    } else {
      this.pdf.setManualScale(value);
    }
  }

  protected toggleLeftSidebar(): void {
    this.state.leftSidebarCollapsed.update((collapsed) => !collapsed);
  }

  protected toggleRightSidebar(): void {
    this.state.rightSidebarCollapsed.update((collapsed) => !collapsed);
  }

  protected toggleGrid(): void {
    this.state.showGrid.update((show) => !show);
  }

  protected toggleSnap(): void {
    this.state.snapToGrid.update((snap) => !snap);
  }
}
