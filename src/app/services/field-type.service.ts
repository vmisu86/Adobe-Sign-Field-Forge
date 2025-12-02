import { Injectable } from '@angular/core';
import { Field, FieldTypeCombination, FormFieldContentType, FormFieldInputType } from '../models/field.model';

@Injectable({
  providedIn: 'root'
})
export class FieldTypeService {
  private readonly fieldTypeCombinations: FieldTypeCombination[] = [
    // Text fields
    { label: 'Text Field', inputType: FormFieldInputType.TEXT_FIELD, contentType: FormFieldContentType.DATA, icon: 'font-size', color: '#1890ff', validation: '', validationData: '' },
    { label: 'Multiline Text', inputType: FormFieldInputType.MULTILINE, contentType: FormFieldContentType.DATA, icon: 'file-text', color: '#1890ff', validation: '', validationData: '' },
    { label: 'Signer Name', inputType: FormFieldInputType.TEXT_FIELD, contentType: FormFieldContentType.SIGNER_NAME, icon: 'user', color: '#13c2c2', validation: '', validationData: '' },
    { label: 'Signer Email', inputType: FormFieldInputType.TEXT_FIELD, contentType: FormFieldContentType.SIGNER_EMAIL, icon: 'mail', color: '#13c2c2', validation: '', validationData: '' },
    // Signature fields
    { label: 'Signature', inputType: FormFieldInputType.SIGNATURE, contentType: FormFieldContentType.SIGNATURE, icon: 'edit', color: '#52c41a', validation: '', validationData: '' },
    { label: 'Initials', inputType: FormFieldInputType.SIGNATURE, contentType: FormFieldContentType.SIGNER_INITIALS, icon: 'highlight', color: '#52c41a', validation: '', validationData: '' },
    // Date fields
    { label: 'Date Field', inputType: FormFieldInputType.DATE, contentType: FormFieldContentType.DATA, icon: 'calendar', color: '#fa8c16', validation: 'DATE_CUSTOM', validationData: 'yyyy-MM-dd' },
    { label: 'Date-CUSTOM Field', inputType: FormFieldInputType.DATE, contentType: FormFieldContentType.DATA, icon: 'calendar', color: '#fa8c16', validation: 'DATE', validationData: '' },
    { label: 'Signing Date', inputType: FormFieldInputType.DATE, contentType: FormFieldContentType.SIGNATURE_DATE, icon: 'calendar', color: '#fa8c16', validation: '', validationData: '', readOnly: true },
    // Other fields
    { label: 'Checkbox', inputType: FormFieldInputType.CHECKBOX, contentType: FormFieldContentType.DATA, icon: 'check-square', color: '#722ed1', validation: '', validationData: '' },
    { label: 'Radio Button', inputType: FormFieldInputType.RADIO, contentType: FormFieldContentType.DATA, icon: 'check-circle', color: '#722ed1', validation: '', validationData: '' },
  ];

  private readonly fieldTypeGroups = [
    {
      label: 'Text Fields',
      items: this.fieldTypeCombinations.filter(f => f.inputType === FormFieldInputType.TEXT_FIELD || f.inputType === FormFieldInputType.MULTILINE)
    },
    {
      label: 'Signature Fields',
      items: this.fieldTypeCombinations.filter(f => f.inputType === FormFieldInputType.SIGNATURE)
    },
    {
      label: 'Date Fields',
      items: this.fieldTypeCombinations.filter(f => f.inputType === FormFieldInputType.DATE)
    },
    {
      label: 'Other Fields',
      items: this.fieldTypeCombinations.filter(f =>
        ![FormFieldInputType.TEXT_FIELD, FormFieldInputType.MULTILINE, FormFieldInputType.SIGNATURE, FormFieldInputType.DATE].includes(f.inputType)
      )
    }
  ];

  private readonly nameMap: { [key: string]: string } = {
    [`${FormFieldInputType.TEXT_FIELD}_${FormFieldContentType.DATA}`]: 'text_field',
    [`${FormFieldInputType.TEXT_FIELD}_${FormFieldContentType.SIGNER_NAME}`]: 'signer_name',
    [`${FormFieldInputType.TEXT_FIELD}_${FormFieldContentType.SIGNER_EMAIL}`]: 'signer_email',
    [`${FormFieldInputType.MULTILINE}_${FormFieldContentType.DATA}`]: 'multiline_text',
    [`${FormFieldInputType.SIGNATURE}_${FormFieldContentType.SIGNATURE}`]: 'signature',
    [`${FormFieldInputType.SIGNATURE}_${FormFieldContentType.SIGNER_INITIALS}`]: 'initials',
    [`${FormFieldInputType.DATE}_${FormFieldContentType.DATA}`]: 'date_field',
    [`${FormFieldInputType.DATE}_${FormFieldContentType.SIGNATURE_DATE}`]: 'date_signed',
    [`${FormFieldInputType.CHECKBOX}_${FormFieldContentType.DATA}`]: 'checkbox',
    [`${FormFieldInputType.RADIO}_${FormFieldContentType.DATA}`]: 'radio_button',
  };

  getFieldTypeCombinations(): FieldTypeCombination[] {
    return [...this.fieldTypeCombinations];
  }

  getFieldTypeGroups(): typeof this.fieldTypeGroups {
    return this.fieldTypeGroups;
  }

  getFieldTypeByKey(key: string): FieldTypeCombination | undefined {
    return this.fieldTypeCombinations.find(ft =>
      `${ft.label}_${ft.inputType}_${ft.contentType}`.toLowerCase() === key
    );
  }

  getFieldColor(field: Field): string {
    const combination = this.fieldTypeCombinations.find(ft =>
      ft.inputType === field.inputType && ft.contentType === field.contentType
    );
    return combination?.color || '#1890ff';
  }

  getFieldIcon(field: Field): string {
    const combination = this.fieldTypeCombinations.find(ft =>
      ft.inputType === field.inputType && ft.contentType === field.contentType
    );
    return combination?.icon || 'question';
  }

  generateSmartFieldName(
    inputType: FormFieldInputType,
    contentType: FormFieldContentType,
    existingFields: Field[]
  ): string {
    const key = `${inputType}_${contentType}`;
    const baseName = this.nameMap[key] || 'field';

    const existingCount = existingFields.filter(f =>
      f.inputType === inputType && f.contentType === contentType
    ).length;

    return `${baseName}_${existingCount + 1}`;
  }
}
