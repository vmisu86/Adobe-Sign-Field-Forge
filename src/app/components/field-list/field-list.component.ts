import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { EditorStateService } from '../../services/editor-state.service';
import { FieldEditorService } from '../../services/field-editor.service';
import { FieldTypeService } from '../../services/field-type.service';
import { PdfDocumentService } from '../../services/pdf-document.service';
import { PdfFieldService } from '../../services/pdf-field.service';

@Component({
  selector: 'app-field-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzIconModule],
  templateUrl: './field-list.component.html',
})
export class FieldListComponent {
  protected readonly fieldTypeService = inject(FieldTypeService);
  protected readonly state = inject(EditorStateService);
  protected readonly editor = inject(FieldEditorService);
  private readonly fields = inject(PdfFieldService);
  protected readonly pdf = inject(PdfDocumentService);

  protected readonly fieldsOnCurrentPage = computed(() =>
    this.fields.fields().filter((field) => field.locations.pageNumber === this.pdf.currentPage()),
  );
}
