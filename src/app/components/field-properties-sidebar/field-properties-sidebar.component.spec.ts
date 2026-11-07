import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorStateService } from '../../services/editor-state.service';
import { PdfFieldService } from '../../services/pdf-field.service';
import { makeField } from '../../testing/test-data';
import { provideTestApp } from '../../testing/test-providers';
import { FieldPropertiesSidebarComponent } from './field-properties-sidebar.component';

describe('FieldPropertiesSidebarComponent (the inspector)', () => {
  let fixture: ComponentFixture<FieldPropertiesSidebarComponent>;
  let host: HTMLElement;
  let fields: PdfFieldService;
  let state: EditorStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldPropertiesSidebarComponent],
      providers: provideTestApp(),
    }).compileComponents();
    fixture = TestBed.createComponent(FieldPropertiesSidebarComponent);
    host = fixture.nativeElement;
    fields = TestBed.inject(PdfFieldService);
    state = TestBed.inject(EditorStateService);
    fixture.detectChanges();
  });

  it('always shows the list of fields, and the properties form only when a field is selected', () => {
    expect(host.querySelector('app-field-list')).not.toBeNull();
    expect(host.querySelector('app-field-property-form')).toBeNull();

    fields.addField(makeField({ id: 'a' }), false);
    state.selectedFieldId.set('a');
    fixture.detectChanges();

    expect(host.querySelector('app-field-property-form')).not.toBeNull();
    expect(host.querySelector('app-field-list')).not.toBeNull();
  });

  it('is a labelled landmark', () => {
    expect(host.querySelector('aside')?.getAttribute('aria-label')).toBe('Inspector');
  });
});
