import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorStateService } from '../../services/editor-state.service';
import { PdfFieldService } from '../../services/pdf-field.service';
import { makeField } from '../../testing/test-data';
import { provideTestApp } from '../../testing/test-providers';
import { ToolbarComponent } from './toolbar.component';

describe('ToolbarComponent', () => {
  let fixture: ComponentFixture<ToolbarComponent>;
  let host: HTMLElement;

  const button = (label: string) => host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolbarComponent],
      providers: provideTestApp(),
    }).compileComponents();
    fixture = TestBed.createComponent(ToolbarComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('disables undo, redo and page buttons before anything happens', () => {
    expect(button('Undo').disabled).toBeTrue();
    expect(button('Redo').disabled).toBeTrue();
    expect(button('Previous page').disabled).toBeTrue();
    expect(button('Next page').disabled).toBeTrue();
  });

  it('enables undo once a field is added, and undo / redo work from the buttons', () => {
    const fields = TestBed.inject(PdfFieldService);
    fields.addField(makeField());
    fixture.detectChanges();
    expect(button('Undo').disabled).toBeFalse();

    button('Undo').click();
    fixture.detectChanges();
    expect(fields.fields()).toEqual([]);
    expect(button('Redo').disabled).toBeFalse();

    button('Redo').click();
    expect(fields.fields().length).toBe(1);
  });

  it('toggles grid, snap and the sidebars', () => {
    const state = TestBed.inject(EditorStateService);

    button('Toggle grid').click();
    button('Snap to grid').click();
    button('Toggle field types panel').click();
    button('Toggle properties panel').click();

    expect(state.showGrid()).toBeTrue();
    expect(state.snapToGrid()).toBeTrue();
    expect(state.leftSidebarCollapsed()).toBeTrue();
    expect(state.rightSidebarCollapsed()).toBeTrue();
  });
});
