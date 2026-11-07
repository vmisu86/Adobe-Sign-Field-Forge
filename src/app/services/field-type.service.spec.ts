import { TestBed } from '@angular/core/testing';
import { FormFieldContentType, FormFieldInputType } from '../models/field.model';
import { makeField } from '../testing/test-data';
import { FieldTypeService } from './field-type.service';

describe('FieldTypeService', () => {
  let service: FieldTypeService;

  const keyOf = (c: { label: string; inputType: string; contentType?: string }) =>
    `${c.label}_${c.inputType}_${c.contentType}`.toLowerCase();

  beforeEach(() => {
    service = TestBed.inject(FieldTypeService);
  });

  it('puts every preset into exactly one group', () => {
    const all = service.getFieldTypeCombinations();
    const grouped = service.getFieldTypeGroups().flatMap((g) => g.items);
    expect(grouped.length).toBe(all.length);
    expect(new Set(grouped.map(keyOf))).toEqual(new Set(all.map(keyOf)));
  });

  it('gives every preset a unique lookup key that resolves back to it', () => {
    const all = service.getFieldTypeCombinations();
    expect(new Set(all.map(keyOf)).size).toBe(all.length);
    for (const preset of all) {
      expect(service.getFieldTypeByKey(keyOf(preset))).toEqual(preset);
    }
  });

  it('returns undefined for an unknown key', () => {
    expect(service.getFieldTypeByKey('nope')).toBeUndefined();
  });

  it('returns a copy of the preset list, not the internal array', () => {
    const list = service.getFieldTypeCombinations();
    list.pop();
    expect(service.getFieldTypeCombinations().length).toBe(list.length + 1);
  });

  describe('smart field names', () => {
    it('numbers fields of the same kind', () => {
      const existing = [makeField({ id: 'a' }), makeField({ id: 'b' })];
      expect(service.generateSmartFieldName(FormFieldInputType.TEXT_FIELD, FormFieldContentType.DATA, existing)).toBe(
        'text_field_3',
      );
    });

    it('counts only fields with the same input and content type', () => {
      const existing = [makeField({ contentType: FormFieldContentType.SIGNER_NAME })];
      expect(service.generateSmartFieldName(FormFieldInputType.TEXT_FIELD, FormFieldContentType.DATA, existing)).toBe(
        'text_field_1',
      );
    });

    it('names every preset with a specific base name, not the generic fallback', () => {
      for (const preset of service.getFieldTypeCombinations()) {
        const name = service.generateSmartFieldName(preset.inputType, preset.contentType!, []);
        expect(name).not.toBe('field_1', `${preset.label} has no entry in nameMap`);
      }
    });
  });

  it('looks up kind and icon from the matching preset and falls back otherwise', () => {
    const signature = makeField({
      inputType: FormFieldInputType.SIGNATURE,
      contentType: FormFieldContentType.SIGNATURE,
    });
    expect(service.getFieldKind(signature)).toBe('signature');
    expect(service.getFieldIcon(signature)).toBe('edit');

    const unknown = makeField({ inputType: FormFieldInputType.IMAGE, contentType: FormFieldContentType.QR_CODE });
    expect(service.getFieldKind(unknown)).toBe('text');
    expect(service.getFieldIcon(unknown)).toBe('question');
  });
});
