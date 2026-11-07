import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { FieldTypeCombination } from '../../models/field.model';
import { EditorStateService } from '../../services/editor-state.service';
import { FieldTypeService } from '../../services/field-type.service';
import { FieldListComponent } from '../field-list/field-list.component';

@Component({
  selector: 'app-field-type-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzLayoutModule, NzInputModule, NzIconModule, NzCardModule, FieldListComponent],
  templateUrl: './field-type-sidebar.component.html',
  styleUrls: ['./field-type-sidebar.component.less'],
})
export class FieldTypeSidebarComponent {
  protected readonly fieldTypeService = inject(FieldTypeService);
  protected readonly state = inject(EditorStateService);

  protected readonly searchFieldType = signal('');

  protected readonly filteredFieldTypeGroups = computed(() => {
    const groups = this.fieldTypeService.getFieldTypeGroups();
    const search = this.searchFieldType().trim().toLowerCase();
    if (!search) return groups;

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.label.toLowerCase().includes(search)),
      }))
      .filter((group) => group.items.length > 0);
  });

  protected selectFieldType(preset: FieldTypeCombination): void {
    this.state.selectedTypeKey.set(this.fieldTypeService.keyOf(preset));
  }

  protected isSelected(preset: FieldTypeCombination): boolean {
    return this.state.selectedTypeKey() === this.fieldTypeService.keyOf(preset);
  }
}
