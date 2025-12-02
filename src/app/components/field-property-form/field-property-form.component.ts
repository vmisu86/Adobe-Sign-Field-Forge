import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { Field } from '../../models/field.model';
import { FieldTypeService } from '../../services/field-type.service';

@Component({
  selector: 'app-field-property-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzCheckboxModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzCardModule
  ],
  templateUrl: './field-property-form.component.html',
  styleUrls: ['./field-property-form.component.less']
})
export class FieldPropertyFormComponent implements OnInit, OnChanges {
  @Input() field!: Field;
  @Output() fieldUpdated = new EventEmitter<Partial<Field>>();
  @Output() deleteClicked = new EventEmitter<void>();

  // Local copy of field for editing
  localField: Field | null = null;

  constructor(public fieldTypeService: FieldTypeService) {}

  ngOnInit(): void {
    this.initializeLocalField();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['field']) {
      this.initializeLocalField();
    }
  }

  private initializeLocalField(): void {
    if (this.field) {
      // Create a deep copy to avoid mutating the original
      this.localField = {
        ...this.field,
        locations: { ...this.field.locations }
      };
    }
  }

  onFieldNameChange(value: string): void {
    if (this.localField) {
      this.localField.name = value;
      this.fieldUpdated.emit({ name: value });
    }
  }

  onPositionChange(property: 'left' | 'top', value: number): void {
    if (this.localField) {
      this.localField.locations[property] = value;
      this.fieldUpdated.emit({
        locations: { ...this.localField.locations }
      });
    }
  }

  onSizeChange(property: 'width' | 'height', value: number): void {
    if (this.localField) {
      this.localField.locations[property] = value;
      this.fieldUpdated.emit({
        locations: { ...this.localField.locations }
      });
    }
  }

  onRecipientChange(value: number): void {
    if (this.localField) {
      this.localField.recipientIndex = value;
      this.fieldUpdated.emit({ recipientIndex: value });
    }
  }

  onRequiredChange(value: boolean): void {
    if (this.localField) {
      this.localField.required = value;
      this.fieldUpdated.emit({ required: value });
    }
  }

  onReadOnlyChange(value: boolean): void {
    if (this.localField) {
      this.localField.readOnly = value;
      this.fieldUpdated.emit({ readOnly: value });
    }
  }

  onDelete(): void {
    this.deleteClicked.emit();
  }
}
