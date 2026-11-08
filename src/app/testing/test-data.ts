import { Field, FormFieldContentType, FormFieldInputType } from '../models/field.model';

/** A US Letter page rendered at 1.5x, the way PdfViewerComponent does by default. */
export const PAGE_WIDTH_POINTS = 612;
export const PAGE_HEIGHT_POINTS = 792;
export const TEST_SCALE = 1.5;

export interface FakeViewport {
  scale: number;
  width: number;
  height: number;
  viewBox: number[];
}

export function makeViewport(
  scale = TEST_SCALE,
  widthPoints = PAGE_WIDTH_POINTS,
  heightPoints = PAGE_HEIGHT_POINTS,
): FakeViewport {
  return {
    scale,
    width: widthPoints * scale,
    height: heightPoints * scale,
    viewBox: [0, 0, widthPoints, heightPoints],
  };
}

export function makeField(overrides: Partial<Field> = {}): Field {
  return {
    id: 'field_1',
    name: 'text_field_1',
    inputType: FormFieldInputType.TEXT_FIELD,
    contentType: FormFieldContentType.DATA,
    required: false,
    recipientIndex: 1,
    validation: '',
    validationData: '',
    readOnly: false,
    locations: { pageNumber: 1, left: 100, top: 700, width: 100, height: 50 },
    ...overrides,
  };
}
