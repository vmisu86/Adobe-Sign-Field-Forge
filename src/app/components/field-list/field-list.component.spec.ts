import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorStateService } from '../../services/editor-state.service';
import { PdfDocumentService } from '../../services/pdf-document.service';
import { PdfFieldService } from '../../services/pdf-field.service';
import { createFakePdf } from '../../testing/fake-pdf-document';
import { makeField } from '../../testing/test-data';
import { provideTestApp } from '../../testing/test-providers';
import { FieldListComponent } from './field-list.component';

describe('FieldListComponent', () => {
  let fixture: ComponentFixture<FieldListComponent>;
  let host: HTMLElement;
  let fields: PdfFieldService;
  let state: EditorStateService;
  let pdf: ReturnType<typeof createFakePdf>;

  const onPage = (pageNumber: number) => ({ pageNumber, left: 10, top: 100, width: 50, height: 20 });
  const rows = () => Array.from(host.querySelectorAll<HTMLElement>('.ff-row'));
  const names = () => Array.from(host.querySelectorAll('.ff-option__label')).map((el) => el.textContent?.trim());

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    pdf = createFakePdf();
    await TestBed.configureTestingModule({
      imports: [FieldListComponent],
      providers: [...provideTestApp(), { provide: PdfDocumentService, useValue: pdf }],
    }).compileComponents();
    fixture = TestBed.createComponent(FieldListComponent);
    host = fixture.nativeElement;
    fields = TestBed.inject(PdfFieldService);
    state = TestBed.inject(EditorStateService);
    fixture.detectChanges();
  });

  it('explains what to do while there are no fields', () => {
    expect(host.textContent).toContain('All fields (0)');
    expect(host.textContent).toContain('drag on the page');
    expect(rows().length).toBe(0);
  });

  it('lists every field of the document, grouped by page and in page order', () => {
    fields.replaceFields(
      [
        makeField({ id: 'c', name: 'on_three', locations: onPage(3) }),
        makeField({ id: 'a', name: 'on_one', locations: onPage(1) }),
        makeField({ id: 'b', name: 'also_one', locations: onPage(1) }),
      ],
      false,
    );
    fixture.detectChanges();

    expect(host.textContent).toContain('All fields (3)');
    expect(Array.from(host.querySelectorAll('.ff-subhead')).map((el) => el.textContent?.trim())).toEqual([
      'Page 1',
      'Page 3',
    ]);
    expect(names()).toEqual(['on_one', 'also_one', 'on_three']);
  });

  it('shows the field that is selected', () => {
    fields.replaceFields([makeField({ id: 'a' }), makeField({ id: 'b', name: 'second' })], false);
    state.selectedFieldId.set('b');
    fixture.detectChanges();

    const selected = host.querySelector('.ff-option.is-selected')!;
    expect(selected.textContent).toContain('second');
    expect(selected.getAttribute('aria-pressed')).toBe('true');
  });

  it('marks required fields', () => {
    fields.replaceFields([makeField({ id: 'a', required: true })], false);
    fixture.detectChanges();
    expect(host.querySelector('.ff-chip--danger')?.textContent).toContain('Required');
  });

  it('picking a field selects it and takes you to its page', () => {
    fields.replaceFields([makeField({ id: 'a' }), makeField({ id: 'b', locations: onPage(3) })], false);
    fixture.detectChanges();

    rows()[1].querySelector<HTMLButtonElement>('.ff-option')!.click();

    expect(state.selectedFieldId()).toBe('b');
    expect(pdf.currentPage()).toBe(3);
    expect(state.revealRequest()).toBe('b');
  });

  it('deletes a field from its row, with a name for screen readers', () => {
    fields.replaceFields([makeField({ id: 'a', name: 'first' }), makeField({ id: 'b', name: 'second' })], false);
    fixture.detectChanges();

    const del = rows()[0].querySelector<HTMLButtonElement>('.ff-row__action')!;
    expect(del.getAttribute('aria-label')).toBe('Delete first');
    del.click();
    fixture.detectChanges();

    expect(names()).toEqual(['second']);
  });

  describe('filter', () => {
    const many = () =>
      Array.from({ length: 9 }, (_, i) => makeField({ id: `f${i}`, name: i < 3 ? `email_${i}` : `field_${i}` }));

    it('only appears once there are enough fields to need one', () => {
      fields.replaceFields(many().slice(0, 7), false);
      fixture.detectChanges();
      expect(host.querySelector('input[type=search]')).toBeNull();

      fields.replaceFields(many(), false);
      fixture.detectChanges();
      expect(host.querySelector('input[type=search]')).not.toBeNull();
    });

    it('narrows the list by name and says when nothing matches', async () => {
      fields.replaceFields(many(), false);
      await settle();
      const input = host.querySelector<HTMLInputElement>('input[type=search]')!;

      input.value = 'EMAIL';
      input.dispatchEvent(new Event('input'));
      await settle();
      expect(names()).toEqual(['email_0', 'email_1', 'email_2']);

      input.value = 'zzz';
      input.dispatchEvent(new Event('input'));
      await settle();
      expect(names()).toEqual([]);
      expect(host.textContent).toContain('No field matches');
    });
  });
});
