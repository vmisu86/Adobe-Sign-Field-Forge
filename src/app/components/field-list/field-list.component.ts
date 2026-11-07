import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { Field } from '../../models/field.model';
import { EditorStateService } from '../../services/editor-state.service';
import { FieldEditorService } from '../../services/field-editor.service';
import { FieldTypeService } from '../../services/field-type.service';
import { PdfFieldService } from '../../services/pdf-field.service';

interface PageGroup {
  page: number;
  fields: Field[];
}

/** Below this many fields the filter box only gets in the way. */
const FILTER_THRESHOLD = 8;

/**
 * Every field in the document, grouped by page. It is the keyboard and screen-reader way to find a
 * field: picking one selects it, goes to its page and scrolls it into view.
 */
@Component({
  selector: 'app-field-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzIconModule, NzInputModule],
  templateUrl: './field-list.component.html',
})
export class FieldListComponent {
  protected readonly fieldTypeService = inject(FieldTypeService);
  protected readonly state = inject(EditorStateService);
  protected readonly editor = inject(FieldEditorService);
  private readonly fields = inject(PdfFieldService);

  protected readonly filter = signal('');
  protected readonly total = computed(() => this.fields.fields().length);
  protected readonly showFilter = computed(() => this.total() >= FILTER_THRESHOLD);

  protected readonly groups = computed<PageGroup[]>(() => {
    const wanted = this.showFilter() ? this.filter().trim().toLowerCase() : '';
    const byPage = new Map<number, Field[]>();
    for (const field of this.fields.fields()) {
      if (wanted && !field.name.toLowerCase().includes(wanted)) continue;
      const page = field.locations.pageNumber;
      byPage.set(page, [...(byPage.get(page) ?? []), field]);
    }
    return [...byPage.entries()].sort(([a], [b]) => a - b).map(([page, fields]) => ({ page, fields }));
  });
}
