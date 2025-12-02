import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { Field, FieldTypeCombination } from '../../models/field.model';
import { FieldListComponent } from '../field-list/field-list.component';
import { FieldTypeService } from '../../services/field-type.service';

interface FieldTypeGroup {
  label: string;
  items: FieldTypeCombination[];
}

@Component({
  selector: 'app-field-type-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzLayoutModule,
    NzInputModule,
    NzIconModule,
    NzCardModule,
    FieldListComponent
  ],
  templateUrl: './field-type-sidebar.component.html',
  styleUrls: ['./field-type-sidebar.component.less']
})
export class FieldTypeSidebarComponent {
  @Input() fieldTypeGroups: FieldTypeGroup[] = [];
  @Input() selectedFieldType: string | null = null;
  @Input() fields: Field[] = [];
  @Input() currentPage = 1;
  @Input() selectedFieldId: string | null = null;

  @Output() fieldTypeSelected = new EventEmitter<FieldTypeCombination>();
  @Output() fieldSelected = new EventEmitter<Field>();

  searchFieldType = '';

  constructor(public fieldTypeService: FieldTypeService) {}

  get filteredFieldTypeGroups(): FieldTypeGroup[] {
    if (!this.searchFieldType) {
      return this.fieldTypeGroups;
    }

    const searchLower = this.searchFieldType.toLowerCase();
    return this.fieldTypeGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          item.label.toLowerCase().includes(searchLower)
        )
      }))
      .filter(group => group.items.length > 0);
  }

  onFieldTypeClick(fieldType: FieldTypeCombination): void {
    this.fieldTypeSelected.emit(fieldType);
  }

  onFieldClick(field: Field): void {
    this.fieldSelected.emit(field);
  }

  isFieldTypeSelected(field: FieldTypeCombination): boolean {
    const key = `${field.label}_${field.inputType}_${field.contentType}`.toLowerCase();
    return this.selectedFieldType === key;
  }
}
