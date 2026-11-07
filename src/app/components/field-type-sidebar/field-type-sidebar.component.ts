import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FieldTypeCombination } from '../../models/field.model';
import { EditorStateService } from '../../services/editor-state.service';
import { FieldEditorService } from '../../services/field-editor.service';
import { FieldTypeService } from '../../services/field-type.service';

/** The tool palette: the Select tool, then every field type, all visible at once. */
@Component({
  selector: 'app-field-type-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzIconModule],
  templateUrl: './field-type-sidebar.component.html',
})
export class FieldTypeSidebarComponent {
  protected readonly fieldTypeService = inject(FieldTypeService);
  protected readonly state = inject(EditorStateService);
  private readonly editor = inject(FieldEditorService);

  protected readonly groups = this.fieldTypeService.getFieldTypeGroups();

  protected selectTool(): void {
    this.editor.selectTool();
  }

  protected selectFieldType(preset: FieldTypeCombination): void {
    this.editor.armType(this.fieldTypeService.keyOf(preset));
  }

  protected isSelected(preset: FieldTypeCombination): boolean {
    return this.state.selectedTypeKey() === this.fieldTypeService.keyOf(preset);
  }
}
