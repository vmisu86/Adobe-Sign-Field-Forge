import {
  AdobeDocumentType,
  Field,
  FormFieldContentType,
  FormFieldInputType,
  FormFieldLocation,
  IFormFieldGeneratorViewModel,
} from '../models/field.model';

/** The file written by "Export" and read back by "Import". */
export interface FieldConfigFile {
  fields: Field[];
  documentType: AdobeDocumentType;
  totalPages: number;
  exportDate: string;
}

export interface ParsedImport {
  fields: Field[];
  /** Present only when the file named a valid document type. */
  documentType?: AdobeDocumentType;
  /** One line per thing that was skipped or defaulted. The import itself still succeeded. */
  warnings: string[];
}

/** The file cannot be used at all (not JSON of the right shape, or no usable field in it). */
export class ImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportError';
  }
}

let idCounter = 0;

/** UI-only identity of a field; it is never exported. */
export function createFieldId(): string {
  idCounter += 1;
  return `field_${Date.now().toString(36)}_${idCounter}`;
}

export function buildConfigFile(
  fields: readonly Field[],
  documentType: AdobeDocumentType,
  totalPages: number,
  now: Date = new Date(),
): FieldConfigFile {
  return {
    fields: fields.map((field) => ({ ...field, locations: { ...field.locations } })),
    documentType,
    totalPages,
    exportDate: now.toISOString(),
  };
}

/**
 * The shape Adobe Sign takes for `formFields`: no UI ids, `locations` as an array.
 * Coordinates are written exactly as stored, so they are in the coordinate system of the
 * document type the fields were placed in.
 */
export function toAdobeFormFields(fields: readonly Field[]): IFormFieldGeneratorViewModel[] {
  return fields.map((field) => ({
    name: field.name,
    inputType: field.inputType,
    contentType: field.contentType,
    required: field.required,
    validation: field.validation,
    validationData: field.validationData,
    readOnly: field.readOnly,
    recipientIndex: field.recipientIndex,
    locations: [
      {
        pageNumber: field.locations.pageNumber,
        left: field.locations.left,
        top: field.locations.top,
        width: field.locations.width,
        height: field.locations.height,
      },
    ],
  }));
}

/**
 * Reads either file format: the FieldForge config (`{ fields, documentType }`) or a bare array in
 * the Adobe Sign `formFields` shape. A field with several `locations` becomes one field per
 * location, because the editor models one rectangle per field.
 */
export function parseImport(raw: unknown): ParsedImport {
  const warnings: string[] = [];
  let entries: unknown[];
  let documentType: AdobeDocumentType | undefined;

  if (Array.isArray(raw)) {
    entries = raw;
  } else if (isRecord(raw) && Array.isArray(raw['fields'])) {
    entries = raw['fields'];
    const declared = raw['documentType'];
    if (declared !== undefined) {
      if (isEnumValue(AdobeDocumentType, declared)) {
        documentType = declared;
      } else {
        warnings.push(`Unknown documentType ${JSON.stringify(declared)} ignored.`);
      }
    }
  } else {
    throw new ImportError('Expected a list of fields or an object with a "fields" list.');
  }

  const fields: Field[] = [];
  entries.forEach((entry, index) => {
    const label = `Field ${index + 1}`;
    if (!isRecord(entry)) {
      warnings.push(`${label} skipped: not an object.`);
      return;
    }

    const inputType = entry['inputType'];
    if (!isEnumValue(FormFieldInputType, inputType)) {
      warnings.push(`${label} skipped: unknown inputType ${JSON.stringify(inputType)}.`);
      return;
    }

    let contentType: FormFieldContentType | undefined;
    if (entry['contentType'] !== undefined && entry['contentType'] !== null) {
      if (!isEnumValue(FormFieldContentType, entry['contentType'])) {
        warnings.push(`${label} skipped: unknown contentType ${JSON.stringify(entry['contentType'])}.`);
        return;
      }
      contentType = entry['contentType'];
    }

    const rawLocations = Array.isArray(entry['locations']) ? entry['locations'] : [entry['locations']];
    const locations: FormFieldLocation[] = [];
    for (const rawLocation of rawLocations) {
      const location = readLocation(rawLocation);
      if (typeof location === 'string') {
        warnings.push(`${label} skipped: ${location}`);
        return;
      }
      locations.push(location);
    }
    if (locations.length === 0) {
      warnings.push(`${label} skipped: no locations.`);
      return;
    }
    if (locations.length > 1) {
      warnings.push(`${label} has ${locations.length} locations and was split into ${locations.length} fields.`);
    }

    const name = typeof entry['name'] === 'string' && entry['name'].trim() ? entry['name'] : `field_${index + 1}`;
    const recipientIndex = readPositiveInteger(entry['recipientIndex']) ?? 1;

    for (const location of locations) {
      fields.push({
        id: createFieldId(),
        name,
        inputType,
        contentType,
        required: entry['required'] === true,
        readOnly: entry['readOnly'] === true,
        recipientIndex,
        validation: typeof entry['validation'] === 'string' ? entry['validation'] : '',
        validationData: typeof entry['validationData'] === 'string' ? entry['validationData'] : '',
        locations: location,
      });
    }
  });

  if (entries.length > 0 && fields.length === 0) {
    throw new ImportError(`None of the ${entries.length} fields could be read. ${warnings[0] ?? ''}`.trim());
  }

  return { fields, documentType, warnings };
}

function readLocation(raw: unknown): FormFieldLocation | string {
  if (!isRecord(raw)) {
    return 'a location is missing or not an object.';
  }
  const pageNumber = readNumber(raw['pageNumber']);
  const left = readNumber(raw['left']);
  const top = readNumber(raw['top']);
  const width = readNumber(raw['width']);
  const height = readNumber(raw['height']);

  if (pageNumber === undefined || !Number.isInteger(pageNumber) || pageNumber < 1) {
    return `pageNumber must be a whole number from 1 (got ${JSON.stringify(raw['pageNumber'])}).`;
  }
  if (left === undefined || top === undefined || width === undefined || height === undefined) {
    return 'left, top, width and height must all be numbers.';
  }
  if (left < 0 || top < 0 || width <= 0 || height <= 0) {
    return 'left and top cannot be negative, and width and height must be above zero.';
  }
  return { pageNumber, left, top, width, height };
}

/** Accepts numbers and numeric strings (older exports wrote some coordinates as strings). */
function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function readPositiveInteger(value: unknown): number | undefined {
  const parsed = readNumber(value);
  return parsed !== undefined && Number.isInteger(parsed) && parsed >= 1 ? parsed : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEnumValue<T extends string>(enumObject: Record<string, T>, value: unknown): value is T {
  return typeof value === 'string' && (Object.values(enumObject) as string[]).includes(value);
}
