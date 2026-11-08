import { AdobeDocumentType, FormFieldContentType, FormFieldInputType } from '../models/field.model';
import { makeField } from '../testing/test-data';
import { buildConfigFile, createFieldId, ImportError, parseImport, toAdobeFormFields } from './field-io';

describe('field-io', () => {
  describe('createFieldId', () => {
    it('never repeats', () => {
      const ids = Array.from({ length: 1000 }, () => createFieldId());
      expect(new Set(ids).size).toBe(1000);
    });
  });

  describe('buildConfigFile', () => {
    it('copies the fields and stamps the document type, page count and date', () => {
      const field = makeField();
      const config = buildConfigFile([field], AdobeDocumentType.LIBRARY, 4, new Date('2026-01-02T03:04:05Z'));
      expect(config).toEqual({
        fields: [field],
        documentType: AdobeDocumentType.LIBRARY,
        totalPages: 4,
        exportDate: '2026-01-02T03:04:05.000Z',
      });
      expect(config.fields[0]).not.toBe(field);
      expect(config.fields[0].locations).not.toBe(field.locations);
    });
  });

  describe('toAdobeFormFields', () => {
    it('drops the UI id and wraps the location in an array', () => {
      const [formField] = toAdobeFormFields([
        makeField({
          id: 'secret-ui-id',
          name: 'sig',
          inputType: FormFieldInputType.SIGNATURE,
          contentType: FormFieldContentType.SIGNATURE,
          required: true,
          readOnly: true,
          recipientIndex: 2,
          validation: 'v',
          validationData: 'd',
          locations: { pageNumber: 3, left: 1, top: 2, width: 3, height: 4 },
        }),
      ]);

      expect(formField).toEqual({
        name: 'sig',
        inputType: FormFieldInputType.SIGNATURE,
        contentType: FormFieldContentType.SIGNATURE,
        required: true,
        readOnly: true,
        recipientIndex: 2,
        validation: 'v',
        validationData: 'd',
        locations: [{ pageNumber: 3, left: 1, top: 2, width: 3, height: 4 }],
      });
      expect(Object.keys(formField)).not.toContain('id');
    });
  });

  describe('parseImport', () => {
    it('reads back what buildConfigFile wrote, with fresh ids', () => {
      const fields = [makeField({ id: 'a' }), makeField({ id: 'b', name: 'other', required: true })];
      const file = JSON.parse(JSON.stringify(buildConfigFile(fields, AdobeDocumentType.LIBRARY, 2)));

      const parsed = parseImport(file);

      expect(parsed.documentType).toBe(AdobeDocumentType.LIBRARY);
      expect(parsed.warnings).toEqual([]);
      expect(parsed.fields.map((f) => ({ ...f, id: '' }))).toEqual(fields.map((f) => ({ ...f, id: '' })));
      expect(parsed.fields.map((f) => f.id)).not.toContain('a');
      expect(new Set(parsed.fields.map((f) => f.id)).size).toBe(2);
    });

    it('reads the Adobe Sign shape and keeps the recipient', () => {
      const adobe = toAdobeFormFields([makeField({ recipientIndex: 2 })]);
      const parsed = parseImport(JSON.parse(JSON.stringify(adobe)));
      expect(parsed.fields.length).toBe(1);
      expect(parsed.fields[0].recipientIndex).toBe(2);
      expect(parsed.documentType).toBeUndefined();
    });

    it('splits a field with several locations into one field per location', () => {
      const parsed = parseImport([
        {
          name: 'initials',
          inputType: 'SIGNATURE',
          contentType: 'SIGNER_INITIALS',
          locations: [
            { pageNumber: 1, left: 10, top: 20, width: 30, height: 40 },
            { pageNumber: 2, left: 11, top: 21, width: 31, height: 41 },
          ],
        },
      ]);

      expect(parsed.fields.map((f) => [f.name, f.locations.pageNumber])).toEqual([
        ['initials', 1],
        ['initials', 2],
      ]);
      expect(parsed.warnings.length).toBe(1);
      expect(parsed.warnings[0]).toContain('split into 2');
    });

    it('accepts numeric strings (older exports) and a single location object', () => {
      const parsed = parseImport({
        fields: [
          {
            name: 'a',
            inputType: 'TEXT_FIELD',
            locations: { pageNumber: '1', left: '10.5', top: '20', width: '30', height: '40' },
          },
        ],
      });
      expect(parsed.fields[0].locations).toEqual({ pageNumber: 1, left: 10.5, top: 20, width: 30, height: 40 });
    });

    it('fills in defaults for missing optional values', () => {
      const [field] = parseImport([
        { inputType: 'CHECKBOX', locations: { pageNumber: 1, left: 0, top: 0, width: 1, height: 1 } },
      ]).fields;
      expect(field).toEqual(
        jasmine.objectContaining({
          name: 'field_1',
          required: false,
          readOnly: false,
          recipientIndex: 1,
          validation: '',
          validationData: '',
          contentType: undefined,
        }),
      );
    });

    it('skips unusable fields, says why, and keeps the good ones', () => {
      const good = {
        name: 'ok',
        inputType: 'TEXT_FIELD',
        locations: { pageNumber: 1, left: 1, top: 1, width: 5, height: 5 },
      };
      const parsed = parseImport([
        good,
        'not an object',
        { ...good, inputType: 'SPARKLE' },
        { ...good, contentType: 'NOPE' },
        { ...good, locations: undefined },
        { ...good, locations: { pageNumber: 0, left: 1, top: 1, width: 5, height: 5 } },
        { ...good, locations: { pageNumber: 1.5, left: 1, top: 1, width: 5, height: 5 } },
        { ...good, locations: { pageNumber: 1, left: 'x', top: 1, width: 5, height: 5 } },
        { ...good, locations: { pageNumber: 1, left: -1, top: 1, width: 5, height: 5 } },
        { ...good, locations: { pageNumber: 1, left: 1, top: 1, width: 0, height: 5 } },
        { ...good, locations: [] },
      ]);

      expect(parsed.fields.length).toBe(1);
      expect(parsed.fields[0].name).toBe('ok');
      expect(parsed.warnings.length).toBe(10);
      expect(parsed.warnings.every((w) => /^Field \d+ skipped/.test(w))).toBeTrue();
    });

    it('warns about an unknown documentType but still imports', () => {
      const parsed = parseImport({
        documentType: 'WEIRD',
        fields: [
          { name: 'a', inputType: 'TEXT_FIELD', locations: { pageNumber: 1, left: 1, top: 1, width: 5, height: 5 } },
        ],
      });
      expect(parsed.documentType).toBeUndefined();
      expect(parsed.warnings[0]).toContain('documentType');
      expect(parsed.fields.length).toBe(1);
    });

    it('accepts an empty list', () => {
      expect(parseImport([]).fields).toEqual([]);
      expect(parseImport({ fields: [] }).fields).toEqual([]);
    });

    it('rejects a file whose fields are all unusable', () => {
      expect(() => parseImport([{ inputType: 'SPARKLE' }, 5])).toThrowMatching(
        (e) => e instanceof ImportError && e.message.includes('None of the 2 fields'),
      );
    });

    for (const [label, value] of [
      ['null', null],
      ['a number', 3],
      ['a string', 'fields'],
      ['an object without fields', { documentType: 'TRANSIENT' }],
      ['an object whose fields is not a list', { fields: {} }],
    ] as const) {
      it(`rejects ${label}`, () => {
        expect(() => parseImport(value)).toThrowMatching((e) => e instanceof ImportError);
      });
    }
  });
});
