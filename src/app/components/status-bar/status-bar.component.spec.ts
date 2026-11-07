import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdobeDocumentType } from '../../models/field.model';
import { EditorStateService } from '../../services/editor-state.service';
import { PdfDocumentService } from '../../services/pdf-document.service';
import { createFakePdf } from '../../testing/fake-pdf-document';
import { StatusBarComponent } from './status-bar.component';

describe('StatusBarComponent', () => {
  let fixture: ComponentFixture<StatusBarComponent>;
  let host: HTMLElement;
  let state: EditorStateService;
  let pdf: ReturnType<typeof createFakePdf>;

  const text = () => (host.textContent ?? '').replace(/\s+/g, ' ').trim();

  beforeEach(async () => {
    pdf = createFakePdf();
    await TestBed.configureTestingModule({
      imports: [StatusBarComponent],
      providers: [{ provide: PdfDocumentService, useValue: pdf }],
    }).compileComponents();
    fixture = TestBed.createComponent(StatusBarComponent);
    host = fixture.nativeElement;
    state = TestBed.inject(EditorStateService);
    fixture.detectChanges();
  });

  it('says which way Y is measured, for the current document type', () => {
    expect(text()).toContain('Transient · Y from bottom of page');

    state.documentType.set(AdobeDocumentType.LIBRARY);
    fixture.detectChanges();
    expect(text()).toContain('Library · Y from top of page');
  });

  it('shows the page size in points', () => {
    expect(text()).toContain('Page 612 × 792 pt');
  });

  it('shows the mouse position as a field would store it', () => {
    state.pointer.set({ x: 150, y: 150 }); // 150 px at 1.5x = 100 pt across and 100 pt down
    fixture.detectChanges();
    expect(text()).toContain('X 100 · Y 692 pt'); // TRANSIENT measures up from the bottom: 792 - 100

    state.documentType.set(AdobeDocumentType.LIBRARY);
    fixture.detectChanges();
    expect(text()).toContain('X 100 · Y 100 pt');
  });

  it('shows no position when the mouse is off the page', () => {
    expect(text()).not.toContain('X ');
    state.pointer.set({ x: 1, y: 1 });
    fixture.detectChanges();
    state.pointer.set(null);
    fixture.detectChanges();
    expect(text()).not.toContain('X ');
  });

  it('shows the zoom only while a PDF is open', () => {
    expect(text()).not.toContain('Zoom');

    pdf.document.set({} as never);
    fixture.detectChanges();
    expect(text()).toContain('Zoom 150%'); // the fake viewport is at 1.5x
  });
});
