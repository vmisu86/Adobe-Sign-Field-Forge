import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PdfDocument } from '../../models/pdf.types';
import { EditorStateService } from '../../services/editor-state.service';
import { HistoryService } from '../../services/history.service';
import { PdfDocumentService } from '../../services/pdf-document.service';
import { PdfFieldService } from '../../services/pdf-field.service';
import { createFakePdf } from '../../testing/fake-pdf-document';
import { makeField } from '../../testing/test-data';
import { provideTestApp } from '../../testing/test-providers';
import { PdfViewerComponent } from './pdf-viewer.component';

describe('PdfViewerComponent', () => {
  let fixture: ComponentFixture<PdfViewerComponent>;
  let fields: PdfFieldService;
  let state: EditorStateService;
  let history: HistoryService;
  let pdf: ReturnType<typeof createFakePdf>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfViewerComponent],
      providers: [...provideTestApp(), { provide: PdfDocumentService, useValue: (pdf = createFakePdf()) }],
    }).compileComponents();

    fixture = TestBed.createComponent(PdfViewerComponent);
    fields = TestBed.inject(PdfFieldService);
    state = TestBed.inject(EditorStateService);
    history = TestBed.inject(HistoryService);
    fixture.detectChanges();
  });

  function press(key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body): void {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));
  }

  it('asks for a PDF when none is open', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Welcome to FieldForge');
    expect(text).toContain('Upload PDF Document');
    expect(fixture.nativeElement.querySelector('canvas')).toBeNull();
  });

  it('shows the toolbar and both sidebars', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('app-toolbar')).not.toBeNull();
    expect(host.querySelector('app-field-type-sidebar')).not.toBeNull();
    expect(host.querySelector('app-field-properties-sidebar')).not.toBeNull();
  });

  it('shows no drawing chip on the Select tool, which is where it starts', () => {
    pdf.document.set({} as PdfDocument);
    fixture.detectChanges();
    expect(state.armed()).toBeFalse();
    expect(fixture.nativeElement.querySelector('.ff-toolchip')).toBeNull();
  });

  describe('drawing chip', () => {
    const host = () => fixture.nativeElement as HTMLElement;

    beforeEach(() => {
      pdf.document.set({} as PdfDocument);
      state.selectedTypeKey.set('signature_signature_signature');
      fixture.detectChanges();
    });

    it('names the armed field type and how to leave', () => {
      const chip = host().querySelector('.ff-toolchip')!;
      expect(chip.textContent).toContain('Signature');
      expect(chip.textContent).toContain('Keep drawing');
      expect(chip.textContent).toContain('Esc');
      expect(chip.classList).toContain('ff-kind-signature');
    });

    it('Keep drawing sets the flag', () => {
      const box = host().querySelector<HTMLInputElement>('.ff-toolchip input[type=checkbox]')!;
      box.click();
      expect(state.keepDrawing()).toBeTrue();
    });

    it('Done returns to the Select tool and removes the chip', () => {
      host().querySelector<HTMLButtonElement>('.ff-toolchip__done')!.click();
      fixture.detectChanges();
      expect(state.armed()).toBeFalse();
      expect(host().querySelector('.ff-toolchip')).toBeNull();
    });
  });

  describe('tool and zoom keys', () => {
    beforeEach(() => {
      pdf.document.set({} as PdfDocument);
      fixture.detectChanges();
    });

    it('a field type letter arms that type; V goes back to Select', () => {
      press('t');
      expect(state.selectedType()?.label).toBe('Text Field');
      press('s');
      expect(state.selectedType()?.label).toBe('Signature');
      press('v');
      expect(state.armed()).toBeFalse();
    });

    it('does not arm a type when no PDF is open', () => {
      pdf.document.set(null);
      press('t');
      expect(state.armed()).toBeFalse();
    });

    it('ignores the letters while typing in a form field', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      try {
        press('t', {}, input);
        expect(state.armed()).toBeFalse();
      } finally {
        input.remove();
      }
    });

    it('Escape leaves the drawing tool', () => {
      press('t');
      press('Escape');
      expect(state.armed()).toBeFalse();
    });

    it('+, - and 0 zoom in, zoom out and fit the width', () => {
      spyOn(pdf, 'zoomIn');
      spyOn(pdf, 'zoomOut');
      spyOn(pdf, 'fitWidth');
      press('+');
      press('-');
      press('0');
      expect(pdf.zoomIn).toHaveBeenCalledTimes(1);
      expect(pdf.zoomOut).toHaveBeenCalledTimes(1);
      expect(pdf.fitWidth).toHaveBeenCalledTimes(1);
    });

    it('Ctrl + wheel zooms and plain wheel scrolls', () => {
      spyOn(pdf, 'zoomIn');
      const workspace = fixture.nativeElement.querySelector('.ff-workspace') as HTMLElement;
      workspace.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }));
      expect(pdf.zoomIn).not.toHaveBeenCalled();

      const zoomWheel = new WheelEvent('wheel', { deltaY: -100, ctrlKey: true, bubbles: true, cancelable: true });
      workspace.dispatchEvent(zoomWheel);
      expect(pdf.zoomIn).toHaveBeenCalledTimes(1);
      expect(zoomWheel.defaultPrevented).toBeTrue(); // the browser's own page zoom must not also fire
    });
  });

  describe('keyboard', () => {
    beforeEach(() => {
      fields.addField(makeField({ id: 'a' }));
      state.selectedFieldId.set('a');
    });

    it('Delete removes the selected field', () => {
      press('Delete');
      expect(fields.fields()).toEqual([]);
    });

    it('Ctrl+Z undoes and Ctrl+Shift+Z / Ctrl+Y redo', () => {
      press('z', { ctrlKey: true });
      expect(fields.fields()).toEqual([]);
      press('Z', { ctrlKey: true, shiftKey: true });
      expect(fields.fields().length).toBe(1);
      press('z', { ctrlKey: true });
      press('y', { ctrlKey: true });
      expect(fields.fields().length).toBe(1);
      expect(history.canRedo()).toBeFalse();
    });

    it('Escape deselects', () => {
      press('Escape');
      expect(state.selectedFieldId()).toBeNull();
    });

    it('leaves Backspace and Ctrl+Z to a text input the user is typing in', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      try {
        press('Backspace', {}, input);
        press('z', { ctrlKey: true }, input);
        expect(fields.fields().length).toBe(1);
      } finally {
        input.remove();
      }
    });

    it('does not let Backspace in a dialog delete the field behind it', () => {
      const overlay = document.createElement('div');
      overlay.className = 'cdk-overlay-container';
      const button = document.createElement('button');
      overlay.appendChild(button);
      document.body.appendChild(overlay);
      try {
        press('Backspace', {}, button);
        expect(fields.fields().length).toBe(1);
      } finally {
        overlay.remove();
      }
    });
  });
});
