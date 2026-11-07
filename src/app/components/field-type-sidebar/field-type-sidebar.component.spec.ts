import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorStateService } from '../../services/editor-state.service';
import { FieldTypeService } from '../../services/field-type.service';
import { provideTestApp } from '../../testing/test-providers';
import { FieldTypeSidebarComponent } from './field-type-sidebar.component';

describe('FieldTypeSidebarComponent (the tool palette)', () => {
  let fixture: ComponentFixture<FieldTypeSidebarComponent>;
  let host: HTMLElement;
  let state: EditorStateService;

  const options = () => Array.from(host.querySelectorAll<HTMLButtonElement>('button.ff-option'));
  const option = (label: string) => options().find((el) => el.textContent?.includes(label))!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldTypeSidebarComponent],
      providers: provideTestApp(),
    }).compileComponents();
    fixture = TestBed.createComponent(FieldTypeSidebarComponent);
    host = fixture.nativeElement;
    state = TestBed.inject(EditorStateService);
    fixture.detectChanges();
  });

  it('shows the Select tool and every field type at once, with their keys', () => {
    const presets = TestBed.inject(FieldTypeService).getFieldTypeCombinations();
    expect(options().length).toBe(presets.length + 1); // + Select

    expect(option('Select').textContent).toContain('V');
    expect(option('Text Field').textContent).toContain('T');
    expect(option('Signature').textContent).toContain('S');
  });

  it('groups the types under their headings', () => {
    const headings = Array.from(host.querySelectorAll('.ff-section__label')).map((el) => el.textContent?.trim());
    expect(headings).toEqual(['Text Fields', 'Signature Fields', 'Date Fields', 'Other Fields']);
  });

  it('starts on Select', () => {
    expect(option('Select').getAttribute('aria-pressed')).toBe('true');
    expect(option('Text Field').getAttribute('aria-pressed')).toBe('false');
  });

  it('picking a type arms it and marks it; Select is then not pressed', () => {
    option('Checkbox').click();
    fixture.detectChanges();

    expect(state.selectedType()?.label).toBe('Checkbox');
    expect(option('Checkbox').getAttribute('aria-pressed')).toBe('true');
    expect(option('Checkbox').classList).toContain('is-selected');
    expect(option('Select').getAttribute('aria-pressed')).toBe('false');
  });

  it('picking the armed type again, or Select, returns to Select', () => {
    option('Checkbox').click();
    option('Checkbox').click();
    expect(state.armed()).toBeFalse();

    option('Signature').click();
    option('Select').click();
    expect(state.armed()).toBeFalse();
  });

  it('colours each type icon with its kind', () => {
    expect(option('Signature').classList).toContain('ff-kind-signature');
    expect(option('Date Field').classList).toContain('ff-kind-date');
    expect(option('Radio Button').classList).toContain('ff-kind-choice');
  });
});
