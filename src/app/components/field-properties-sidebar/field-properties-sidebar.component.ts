import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { Field } from '../../models/field.model';
import { FieldPropertyFormComponent } from '../field-property-form/field-property-form.component';

@Component({
  selector: 'app-field-properties-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    NzLayoutModule,
    NzEmptyModule,
    FieldPropertyFormComponent
  ],
  templateUrl: './field-properties-sidebar.component.html',
  styleUrls: ['./field-properties-sidebar.component.less']
})
export class FieldPropertiesSidebarComponent {
  @Input() selectedField: Field | null = null;
  @Output() fieldUpdated = new EventEmitter<Partial<Field>>();
  @Output() fieldDeleted = new EventEmitter<void>();

  onFieldUpdated(updates: Partial<Field>): void {
    this.fieldUpdated.emit(updates);
  }

  onFieldDeleted(): void {
    this.fieldDeleted.emit();
  }
}
