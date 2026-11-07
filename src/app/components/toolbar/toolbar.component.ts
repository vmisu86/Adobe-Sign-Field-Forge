import { ChangeDetectionStrategy, Component, effect, inject, untracked, viewChild } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { AdobeDocumentType } from '../../models/field.model';
import { EditorStateService } from '../../services/editor-state.service';
import { FieldEditorService } from '../../services/field-editor.service';
import { FileActionsService } from '../../services/file-actions.service';
import { HistoryService } from '../../services/history.service';
import { PdfDocumentService } from '../../services/pdf-document.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzDividerModule,
    NzSelectModule,
    NzSpaceModule,
    NzToolTipModule,
    NzLayoutModule,
  ],
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.less'],
})
export class ToolbarComponent {
  protected readonly state = inject(EditorStateService);
  protected readonly history = inject(HistoryService);
  protected readonly pdf = inject(PdfDocumentService);
  protected readonly actions = inject(FileActionsService);
  protected readonly editor = inject(FieldEditorService);
  protected readonly DocumentType = AdobeDocumentType;

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
