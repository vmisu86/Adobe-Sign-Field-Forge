import { Injectable } from '@angular/core';
import {
  Field,
  FieldKind,
  FieldTypeCombination,
  FieldTypeGroup,
  fieldTypeKey,
  FormFieldContentType,
  FormFieldInputType,
} from '../models/field.model';

/** Size in PDF points of a field created by a plain click instead of a drag. */
const DEFAULT_SIZES: Partial<Record<FormFieldInputType, { width: number; height: number }>> = {
  [FormFieldInputType.TEXT_FIELD]: { width: 150, height: 24 },
  [FormFieldInputType.MULTILINE]: { width: 200, height: 60 },
  [FormFieldInputType.SIGNATURE]: { width: 150, height: 40 },
  [FormFieldInputType.DATE]: { width: 100, height: 24 },
  [FormFieldInputType.CHECKBOX]: { width: 16, height: 16 },
  [FormFieldInputType.RADIO]: { width: 16, height: 16 },
};
const FALLBACK_SIZE = { width: 120, height: 24 };

@Injectable({
  providedIn: 'root',
})
export class FieldTypeService {
  private readonly fieldTypeCombinations: FieldTypeCombination[] = [
    // Text fields
    {
      label: 'Text Field',
      inputType: FormFieldInputType.TEXT_FIELD,
      contentType: FormFieldContentType.DATA,
      icon: 'font-size',
      kind: 'text',
      validation: '',
      validationData: '',
    },
    {
      label: 'Multiline Text',
      inputType: FormFieldInputType.MULTILINE,
      contentType: FormFieldContentType.DATA,
      icon: 'file-text',
      kind: 'text',
      validation: '',
      validationData: '',
    },
    {
      label: 'Signer Name',
      inputType: FormFieldInputType.TEXT_FIELD,
      contentType: FormFieldContentType.SIGNER_NAME,
      icon: 'user',
      kind: 'text',
      validation: '',
      validationData: '',
    },
    {
      label: 'Signer Email',
      inputType: FormFieldInputType.TEXT_FIELD,
      contentType: FormFieldContentType.SIGNER_EMAIL,
      icon: 'mail',
      kind: 'text',
      validation: '',
      validationData: '',
    },
    // Signature fields
    {
      label: 'Signature',
      inputType: FormFieldInputType.SIGNATURE,
      contentType: FormFieldContentType.SIGNATURE,
      icon: 'edit',
      kind: 'signature',
      validation: '',
      validationData: '',
    },
    {
      label: 'Initials',
      inputType: FormFieldInputType.SIGNATURE,
      contentType: FormFieldContentType.SIGNER_INITIALS,
      icon: 'highlight',
      kind: 'signature',
      validation: '',
      validationData: '',
    },
    // Date fields
    {
      label: 'Date Field',
      inputType: FormFieldInputType.DATE,
      contentType: FormFieldContentType.DATA,
      icon: 'calendar',
      kind: 'date',
      validation: 'DATE',
      validationData: '',
    },
    {
      label: 'Date-CUSTOM Field',
      inputType: FormFieldInputType.DATE,
      contentType: FormFieldContentType.DATA,
      icon: 'calendar',
      kind: 'date',
      validation: 'DATE_CUSTOM',
      validationData: 'yyyy-MM-dd',
    },
    {
      label: 'Signing Date',
      inputType: FormFieldInputType.DATE,
      contentType: FormFieldContentType.SIGNATURE_DATE,
      icon: 'calendar',
      kind: 'date',
      validation: '',
      validationData: '',
      readOnly: true,
    },
    // Other fields
    {
      label: 'Checkbox',
      inputType: FormFieldInputType.CHECKBOX,
      contentType: FormFieldContentType.DATA,
      icon: 'check-square',
      kind: 'choice',
      validation: '',
      validationData: '',
    },
    {
      label: 'Radio Button',
      inputType: FormFieldInputType.RADIO,
      contentType: FormFieldContentType.DATA,
      icon: 'check-circle',
      kind: 'choice',
      validation: '',
      validationData: '',
    },
  ];

  private readonly fieldTypeGroups: FieldTypeGroup[] = [
    {
      label: 'Text Fields',
      items: this.fieldTypeCombinations.filter(
        (f) => f.inputType === FormFieldInputType.TEXT_FIELD || f.inputType === FormFieldInputType.MULTILINE,
      ),
    },
    {
      label: 'Signature Fields',
      items: this.fieldTypeCombinations.filter((f) => f.inputType === FormFieldInputType.SIGNATURE),
    },
    {
      label: 'Date Fields',
      items: this.fieldTypeCombinations.filter((f) => f.inputType === FormFieldInputType.DATE),
    },
    {
      label: 'Other Fields',
      items: this.fieldTypeCombinations.filter(
        (f) =>
          ![
            FormFieldInputType.TEXT_FIELD,
            FormFieldInputType.MULTILINE,
            FormFieldInputType.SIGNATURE,
            FormFieldInputType.DATE,
          ].includes(f.inputType),
      ),
    },
  ];

  private readonly nameMap: Record<string, string> = {
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

  getFieldTypeGroups(): FieldTypeGroup[] {
    return this.fieldTypeGroups;
  }

  keyOf(preset: Pick<FieldTypeCombination, 'label' | 'inputType' | 'contentType'>): string {
    return fieldTypeKey(preset);
  }

  getFieldTypeByKey(key: string): FieldTypeCombination | undefined {
    return this.fieldTypeCombinations.find((ft) => fieldTypeKey(ft) === key);
  }

  getFieldKind(field: Field): FieldKind {
    const combination = this.fieldTypeCombinations.find(
      (ft) => ft.inputType === field.inputType && ft.contentType === field.contentType,
    );
    return combination?.kind ?? 'text';
  }

  getFieldIcon(field: Field): string {
    const combination = this.fieldTypeCombinations.find(
      (ft) => ft.inputType === field.inputType && ft.contentType === field.contentType,
    );
    return combination?.icon || 'question';
  }

  generateSmartFieldName(
    inputType: FormFieldInputType,
    contentType: FormFieldContentType,
    existingFields: Field[],
  ): string {
    const key = `${inputType}_${contentType}`;
    const baseName = this.nameMap[key] || 'field';

    const existingCount = existingFields.filter(
      (f) => f.inputType === inputType && f.contentType === contentType,
    ).length;

    return `${baseName}_${existingCount + 1}`;
  }

  /** Size to give a field the user created with a click rather than a drag. */
  getDefaultSize(inputType: FormFieldInputType): { width: number; height: number } {
    return DEFAULT_SIZES[inputType] ?? FALLBACK_SIZE;
  }

  /** Display name of a recipient index (1 = signer, 2 = approver). */
  getRecipientLabel(index: number): string {
    switch (index) {
      case 1:
        return 'SIGNER';
      case 2:
        return 'APPROVER';
      default:
        return 'UNKNOWN';
    }
  }
}
