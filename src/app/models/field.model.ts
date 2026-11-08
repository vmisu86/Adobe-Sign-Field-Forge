export enum FormFieldInputType {
  TEXT_FIELD = 'TEXT_FIELD',
  MULTILINE = 'MULTILINE',
  CHECKBOX = 'CHECKBOX',
  RADIO = 'RADIO',
  DROP_DOWN = 'DROP_DOWN',
  SIGNATURE = 'SIGNATURE',
  DATE = 'DATE',
  HYPERLINK = 'HYPERLINK',
  IMAGE = 'IMAGE',
}

export enum AdobeDocumentType {
  LIBRARY = 'LIBRARY',
  TRANSIENT = 'TRANSIENT',
}

export enum FormFieldContentType {
  DATA = 'DATA',
  SIGNATURE = 'SIGNATURE',
  SIGNER_INITIALS = 'SIGNER_INITIALS',
  SIGNER_NAME = 'SIGNER_NAME',
  SIGNER_EMAIL = 'SIGNER_EMAIL',
  SIGNATURE_DATE = 'SIGNATURE_DATE',
  SIGNER_TITLE = 'SIGNER_TITLE',
  SIGNER_COMPANY = 'SIGNER_COMPANY',
  IMAGE = 'IMAGE',
  QR_CODE = 'QR_CODE',
  HYPERLINK = 'HYPERLINK',
}

export interface FormFieldLocation {
  pageNumber: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Field {
  id: string; // For UI tracking only
  name: string;
  inputType: FormFieldInputType;
  contentType?: FormFieldContentType;
  required: boolean;
  locations: FormFieldLocation;
  recipientIndex: number; // 1 = SIGNER, 2 = APPROVER
  validation: string;
  validationData: string;
  readOnly?: boolean;
}

// Backend ViewModel format
export interface IFormFieldGeneratorViewModel {
  name: string;
  inputType: FormFieldInputType;
  contentType?: FormFieldContentType;
  required: boolean;
  validation: string;
  validationData: string;
  readOnly?: boolean;
  recipientIndex: number;
  locations: FormFieldLocation[];
}

/** Family of a field type; decides its colour (see the --ff-field-* tokens) and its group in the sidebar. */
export type FieldKind = 'text' | 'signature' | 'date' | 'choice';

// Field type combinations for dropdown
export interface FieldTypeCombination {
  label: string;
  inputType: FormFieldInputType;
  contentType?: FormFieldContentType;
  icon: string;
  kind: FieldKind;
  /** Single key that arms this preset when pressed on the canvas (case-insensitive). */
  shortcut?: string;
  validation: string;
  validationData: string;
  readOnly?: boolean;
}

export interface FieldTypeGroup {
  label: string;
  items: FieldTypeCombination[];
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Lookup key of a field type preset. The label is part of it because several presets share
 * the same input and content type (the two date presets).
 */
export function fieldTypeKey(preset: Pick<FieldTypeCombination, 'label' | 'inputType' | 'contentType'>): string {
  return `${preset.label}_${preset.inputType}_${preset.contentType}`.toLowerCase();
}
