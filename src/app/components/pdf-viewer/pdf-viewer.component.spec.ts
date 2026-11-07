import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorStateService } from '../../services/editor-state.service';
import { HistoryService } from '../../services/history.service';
import { PdfFieldService } from '../../services/pdf-field.service';
import { makeField } from '../../testing/test-data';
import { provideTestApp } from '../../testing/test-providers';
import { PdfViewerComponent } from './pdf-viewer.component';

describe('PdfViewerComponent', () => {
  let fixture: ComponentFixture<PdfViewerComponent>;
  let fields: PdfFieldService;
  let state: EditorStateService;
  let history: HistoryService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfViewerComponent],
      providers: provideTestApp(),
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

  it('shows which field type is selected and lets the banner be closed', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.ff-banner')?.textContent).toContain('Text Field');

    host.querySelector<HTMLButtonElement>('.ff-banner button')!.click();
    fixture.detectChanges();
    expect(state.selectedTypeKey()).toBe('');
    expect(host.querySelector('.ff-banner')).toBeNull();
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
