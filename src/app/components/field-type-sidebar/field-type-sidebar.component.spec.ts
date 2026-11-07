import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorStateService } from '../../services/editor-state.service';
import { PdfFieldService } from '../../services/pdf-field.service';
import { makeField } from '../../testing/test-data';
import { provideTestApp } from '../../testing/test-providers';
import { FieldTypeSidebarComponent } from './field-type-sidebar.component';

describe('FieldTypeSidebarComponent', () => {
  let fixture: ComponentFixture<FieldTypeSidebarComponent>;
  let host: HTMLElement;

  const labels = () =>
    Array.from(
      host.querySelectorAll('.ff-panel__body > .ff-section .ff-option:not(.ff-option--compact) .ff-option__label'),
    ).map((el) => el.textContent?.trim());

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldTypeSidebarComponent],
      providers: provideTestApp(),
    }).compileComponents();
    fixture = TestBed.createComponent(FieldTypeSidebarComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('lists every preset under its group', () => {
    expect(labels()).toContain('Text Field');
    expect(labels()).toContain('Signature');
    expect(labels()).toContain('Radio Button');
    expect(Array.from(host.querySelectorAll('.ff-section__label')).map((el) => el.textContent?.trim())).toContain(
      'Signature Fields',
    );
  });

  it('filters by the search box and hides groups with no match', async () => {
    const input = host.querySelector('input')!;
    input.value = 'sign';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(labels()).toEqual(['Signer Name', 'Signer Email', 'Signature', 'Signing Date']);
    expect(host.textContent).not.toContain('Other Fields');
  });

  it('selects a preset when its card is clicked and marks it', () => {
    const state = TestBed.inject(EditorStateService);
    const card = Array.from(host.querySelectorAll<HTMLElement>('button.ff-option')).find((el) =>
      el.textContent?.includes('Checkbox'),
    )!;

    card.click();
    fixture.detectChanges();

    expect(state.selectedType()?.label).toBe('Checkbox');
    expect(card.classList).toContain('is-selected');
    expect(card.getAttribute('aria-pressed')).toBe('true');
  });

  it('lists the fields on the current page and selects one when clicked', () => {
    const fields = TestBed.inject(PdfFieldService);
    const state = TestBed.inject(EditorStateService);
    fields.addField(makeField({ id: 'a', name: 'first' }), false);
    fields.addField(
      makeField({ id: 'b', name: 'second', locations: { pageNumber: 2, left: 1, top: 1, width: 1, height: 1 } }),
      false,
    );
    fixture.detectChanges();

    const names = Array.from(host.querySelectorAll('.ff-option--compact .ff-option__label')).map((el) =>
      el.textContent?.trim(),
    );
    expect(names).toEqual(['first']);

    host.querySelector<HTMLElement>('.ff-option--compact')!.click();
    expect(state.selectedFieldId()).toBe('a');
  });
});
