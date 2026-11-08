import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AdobeDocumentType } from '../models/field.model';
import { createFakePdf } from '../testing/fake-pdf-document';
import { makeField } from '../testing/test-data';
import { provideTestApp } from '../testing/test-providers';
import { EditorStateService } from './editor-state.service';
import { FileActionsService } from './file-actions.service';
import { HistoryService } from './history.service';
import { PdfDocumentService } from './pdf-document.service';
import { PdfFieldService } from './pdf-field.service';

describe('FileActionsService', () => {
  let actions: FileActionsService;
  let fields: PdfFieldService;
  let state: EditorStateService;
  let history: HistoryService;
  let message: jasmine.SpyObj<Pick<NzMessageService, 'success' | 'error' | 'warning'>>;
  let originalInputClick: () => void;

  /** Make the next `<input type=file>.click()` answer with a file made from `contents`. */
  function chooseFile(contents: string, name = 'config.json', type = 'application/json'): void {
    HTMLInputElement.prototype.click = function (this: HTMLInputElement) {
      const transfer = new DataTransfer();
      transfer.items.add(new File([contents], name, { type }));
      this.files = transfer.files;
      this.dispatchEvent(new Event('change'));
    };
  }

  function chooseNothing(): void {
    HTMLInputElement.prototype.click = function (this: HTMLInputElement) {
      this.dispatchEvent(new Event('cancel'));
    };
  }

  beforeEach(() => {
    message = jasmine.createSpyObj('NzMessageService', ['success', 'error', 'warning']);
    TestBed.configureTestingModule({
      providers: [
        ...provideTestApp(),
        { provide: NzMessageService, useValue: message },
        { provide: PdfDocumentService, useValue: createFakePdf() },
      ],
    });
    actions = TestBed.inject(FileActionsService);
    fields = TestBed.inject(PdfFieldService);
    state = TestBed.inject(EditorStateService);
    history = TestBed.inject(HistoryService);
    originalInputClick = HTMLInputElement.prototype.click;
  });

  afterEach(() => {
    HTMLInputElement.prototype.click = originalInputClick;
    document.querySelectorAll('.ant-modal-root, .ant-modal-wrap').forEach((el) => el.remove());
  });

  describe('importConfig', () => {
    const goodField = {
      name: 'imported',
      inputType: 'TEXT_FIELD',
      locations: { pageNumber: 1, left: 1, top: 2, width: 3, height: 4 },
    };

    it('replaces the fields with an undo step', async () => {
      fields.addField(makeField({ id: 'old' }), false);
      chooseFile(JSON.stringify({ fields: [goodField] }));

      await actions.importConfig();

      expect(fields.fields().map((f) => f.name)).toEqual(['imported']);
      expect(history.getHistorySize().undo).toBe(1);
      expect(message.success).toHaveBeenCalledWith('Imported 1 field.');

      history.undo();
      expect(fields.fields().map((f) => f.id)).toEqual(['old']);
    });

    it('switches the document type the file was made for, without keeping stale history', async () => {
      fields.addField(makeField({ id: 'old' }));
      chooseFile(JSON.stringify({ documentType: 'LIBRARY', fields: [goodField] }));

      await actions.importConfig();

      expect(state.documentType()).toBe(AdobeDocumentType.LIBRARY);
      expect(history.canUndo()).toBeFalse();
      expect(fields.fields().length).toBe(1);
    });

    it('tells the user about skipped fields but imports the rest', async () => {
      chooseFile(JSON.stringify([goodField, { inputType: 'SPARKLE' }]));

      await actions.importConfig();

      expect(fields.fields().length).toBe(1);
      expect(message.warning).toHaveBeenCalledTimes(1);
      expect(message.warning.calls.mostRecent().args[0]).toContain('Field 2 skipped');
    });

    it('warns about fields beyond the last page of the open PDF', async () => {
      chooseFile(
        JSON.stringify([{ ...goodField, locations: { pageNumber: 9, left: 1, top: 2, width: 3, height: 4 } }]),
      );

      await actions.importConfig();

      expect(message.warning.calls.mostRecent().args[0]).toContain('after the last page (3)');
    });

    it('rejects text that is not JSON and leaves the fields alone', async () => {
      fields.addField(makeField({ id: 'old' }), false);
      chooseFile('not json {');

      await actions.importConfig();

      expect(message.error).toHaveBeenCalledWith('That file is not valid JSON.');
      expect(fields.fields().map((f) => f.id)).toEqual(['old']);
    });

    it('rejects JSON of the wrong shape and leaves the fields alone', async () => {
      fields.addField(makeField({ id: 'old' }), false);
      chooseFile('{"hello": 1}');

      await actions.importConfig();

      expect(message.error).toHaveBeenCalled();
      expect(fields.fields().map((f) => f.id)).toEqual(['old']);
    });

    it('does nothing when the file dialog is cancelled', async () => {
      fields.addField(makeField({ id: 'old' }), false);
      chooseNothing();

      await actions.importConfig();

      expect(message.success).not.toHaveBeenCalled();
      expect(message.error).not.toHaveBeenCalled();
      expect(fields.fields().map((f) => f.id)).toEqual(['old']);
    });
  });

  describe('openPdf', () => {
    it('refuses a file that is not a PDF', async () => {
      await actions.openPdf(new File(['x'], 'notes.txt', { type: 'text/plain' }));
      expect(message.error).toHaveBeenCalledWith('Please choose a PDF file.');
    });

    it('does nothing without a file', async () => {
      await actions.openPdf(null);
      expect(message.error).not.toHaveBeenCalled();
    });
  });

  describe('showJson', () => {
    const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

    it('opens a dialog whose Close button closes it', async () => {
      fields.addField(makeField({ id: 'a', name: 'visible_in_json' }), false);

      actions.showJson();
      TestBed.inject(ApplicationRef).tick();
      await wait(100);
      TestBed.inject(ApplicationRef).tick();

      const dialog = document.querySelector('.ant-modal')!;
      expect(dialog.textContent).toContain('visible_in_json');

      const footerButtons = Array.from(dialog.querySelectorAll<HTMLButtonElement>('.ant-modal-footer button'));
      footerButtons.find((b) => b.textContent?.trim() === 'Close')!.click();
      TestBed.inject(ApplicationRef).tick();
      await wait(600); // the dialog animates out

      expect(document.querySelector('.ant-modal')).toBeNull();
    });
  });

  describe('requestDocumentType', () => {
    it('switches straight away when there are no fields', async () => {
      await actions.requestDocumentType(AdobeDocumentType.LIBRARY);
      expect(state.documentType()).toBe(AdobeDocumentType.LIBRARY);
    });

    it('refuses to remap when fields exist but no PDF is open, and resyncs the select', async () => {
      fields.addField(makeField(), false);
      const before = state.documentTypeResync();

      await actions.requestDocumentType(AdobeDocumentType.LIBRARY);

      expect(state.documentType()).toBe(AdobeDocumentType.TRANSIENT);
      expect(message.error).toHaveBeenCalled();
      expect(state.documentTypeResync()).toBe(before + 1);
    });
  });
});
