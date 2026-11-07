import { inject, Injectable } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AdobeDocumentType } from '../models/field.model';
import { buildConfigFile, ImportError, parseImport, ParsedImport, toAdobeFormFields } from '../utils/field-io';
import { downloadJson, pickFile, pickJsonFile } from '../utils/file-transfer';
import { EditorStateService } from './editor-state.service';
import { FieldEditorService } from './field-editor.service';
import { HistoryService } from './history.service';
import { PdfDocumentService } from './pdf-document.service';
import { PdfFieldService } from './pdf-field.service';

/** Things the user does with files and dialogs: open a PDF, import / export fields, view the JSON. */
@Injectable({
  providedIn: 'root',
})
export class FileActionsService {
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  private readonly pdf = inject(PdfDocumentService);
  private readonly fields = inject(PdfFieldService);
  private readonly state = inject(EditorStateService);
  private readonly editor = inject(FieldEditorService);
  private readonly history = inject(HistoryService);

  /** Open the file dialog and load the PDF the user picks. */
  async choosePdf(): Promise<void> {
    await this.openPdf(await pickFile('application/pdf,.pdf'));
  }

  async openPdf(file: File | null | undefined): Promise<void> {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      this.message.error('Please choose a PDF file.');
      return;
    }

    try {
      await this.pdf.load(await file.arrayBuffer());
    } catch (error) {
      console.error('Could not open the PDF', error);
      this.message.error('That file could not be opened as a PDF.');
    }
  }

  exportConfig(): void {
    const config = buildConfigFile(this.fields.getFields(), this.state.documentType(), this.pdf.totalPages());
    downloadJson(`fieldforge-config-${Date.now()}.json`, config);
    this.message.success('Configuration exported successfully!');
  }

  /** The array Adobe Sign takes as `formFields`, ready to paste into an API call. */
  exportAdobeFormFields(): void {
    const fields = this.fields.getFields();
    downloadJson(`adobe-sign-formfields-${Date.now()}.json`, toAdobeFormFields(fields));
    this.message.success(`Exported ${fields.length} fields for the Adobe Sign API.`);
  }

  async importConfig(): Promise<void> {
    let text: string | null;
    try {
      text = await pickJsonFile();
    } catch (error) {
      console.error('Could not read the file', error);
      this.message.error('That file could not be read.');
      return;
    }
    if (text === null) return;

    let parsed: ParsedImport;
    try {
      parsed = parseImport(JSON.parse(text));
    } catch (error) {
      this.message.error(error instanceof ImportError ? error.message : 'That file is not valid JSON.');
      return;
    }

    const { fields, documentType, warnings } = parsed;
    const pageCount = this.pdf.totalPages();
    if (pageCount > 0) {
      const beyond = fields.filter((field) => field.locations.pageNumber > pageCount);
      if (beyond.length > 0) {
        warnings.push(`${beyond.length} field(s) are on pages after the last page (${pageCount}) of this PDF.`);
      }
    }

    if (documentType && documentType !== this.state.documentType()) {
      // The file's coordinates only make sense in its own system, and older history is in the other one.
      this.fields.replaceFields(fields, false);
      this.history.clear();
      this.state.documentType.set(documentType);
    } else {
      this.fields.replaceFields(fields);
    }
    this.state.selectedFieldId.set(null);

    this.message.success(`Imported ${fields.length} field${fields.length === 1 ? '' : 's'}.`);
    if (warnings.length > 0) {
      console.warn('Import notes:\n' + warnings.join('\n'));
      this.message.warning(`${warnings.length} note${warnings.length === 1 ? '' : 's'}: ${warnings[0]}`, {
        nzDuration: 8000,
      });
    }
  }

  showJson(): void {
    const json = JSON.stringify(
      {
        fields: this.fields.getFields(),
        documentType: this.state.documentType(),
        totalPages: this.pdf.totalPages(),
        currentPage: this.pdf.currentPage(),
      },
      null,
      2,
    );

    const dialog = this.modal.create({
      nzTitle: 'Field Configuration JSON',
      nzContent: `<pre class="json-view"><code>${escapeHtml(json)}</code></pre>`,
      nzWidth: 800,
      nzFooter: [
        {
          label: 'Copy to Clipboard',
          type: 'primary',
          onClick: () => {
            navigator.clipboard.writeText(json).then(
              () => this.message.success('JSON copied to clipboard!'),
              () => this.message.error('The browser did not allow copying.'),
            );
          },
        },
        {
          label: 'Close',
          // A footer button does not close the dialog by itself.
          onClick: () => dialog.close(),
        },
      ],
    });
  }

  /** Ask before remapping when there are fields; switch straight away when there are none. */
  async requestDocumentType(type: AdobeDocumentType): Promise<void> {
    if (type === this.state.documentType()) return;

    if (this.fields.getFields().length === 0) {
      await this.editor.applyDocumentType(type);
      return;
    }

    if (!this.pdf.document()) {
      this.message.error(
        'Open the PDF first: the page sizes are needed to move the fields to the other coordinate system.',
      );
      this.resyncDocumentType();
      return;
    }

    this.modal.confirm({
      nzTitle: 'Change Document Type - Field Remapping Required',
      nzContent: `
        <p>Adobe Sign measures a field's <strong>top</strong> from a different edge of the page:</p>
        <ul>
          <li><strong>TRANSIENT:</strong> from the bottom of the page (origin bottom-left)</li>
          <li><strong>LIBRARY:</strong> from the top of the page (origin top-left)</li>
        </ul>
        <p>Every field's top is recalculated so it stays where it is on the page, and the exported values change.</p>
        <p class="remap-warning">
          <strong>Note:</strong> the undo history is cleared by this change.
        </p>
      `,
      nzOkText: 'Continue with Remapping',
      nzCancelText: 'Cancel',
      nzWidth: 520,
      nzMaskClosable: false,
      nzOnOk: async () => {
        try {
          await this.editor.applyDocumentType(type);
        } catch (error) {
          console.error('Could not remap the fields', error);
          this.message.error('The fields could not be remapped.');
          this.resyncDocumentType();
        }
      },
      nzOnCancel: () => this.resyncDocumentType(),
    });
  }

  private resyncDocumentType(): void {
    this.state.documentTypeResync.update((n) => n + 1);
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (c) => map[c]);
}
