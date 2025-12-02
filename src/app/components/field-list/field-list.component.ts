import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Field } from '../../models/field.model';
import { FieldTypeService } from '../../services/field-type.service';

@Component({
  selector: 'app-field-list',
  standalone: true,
  imports: [
    CommonModule,
    NzListModule,
    NzIconModule,
    NzTagModule
  ],
  templateUrl: './field-list.component.html',
  styleUrls: ['./field-list.component.less']
})
export class FieldListComponent {
  @Input() fields: Field[] = [];
  @Input() selectedFieldId: string | null = null;
  @Input() currentPage = 1;
  @Output() fieldSelected = new EventEmitter<Field>();

  constructor(public fieldTypeService: FieldTypeService) {}

  get fieldsOnCurrentPage(): Field[] {
    return this.fields.filter(f => f.locations.pageNumber === this.currentPage);
  }

  onFieldClick(field: Field): void {
    this.fieldSelected.emit(field);
  }

  isSelected(field: Field): boolean {
    return this.selectedFieldId === field.id;
  }
}
