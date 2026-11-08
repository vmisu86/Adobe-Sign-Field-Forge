import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Field } from '../../models/field.model';
import { makeField } from '../../testing/test-data';
import { provideTestApp } from '../../testing/test-providers';
import { FieldPropertyFormComponent } from './field-property-form.component';

@Component({
  imports: [FieldPropertyFormComponent],
  template: `<app-field-property-form
    [field]="field()"
    (fieldUpdated)="updates.push($event)"
    (deleteClicked)="deletes = deletes + 1"
  />`,
})
class HostComponent {
  readonly field = signal<Field>(makeField());
  updates: Partial<Field>[] = [];
  deletes = 0;
}

describe('FieldPropertyFormComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let root: HTMLElement;

  const input = (name: string) => root.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function type(el: HTMLInputElement, value: string): Promise<void> {
    el.value = value;
    el.dispatchEvent(new Event('input'));
    await settle();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: provideTestApp(),
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    root = fixture.nativeElement;
    await settle();
  });

  it('shows the field it was given', () => {
    expect(input('fieldName').value).toBe('text_field_1');
    expect(input('left').value).toBe('100');
    expect(input('top').value).toBe('700');
    expect(input('width').value).toBe('100');
    expect(input('height').value).toBe('50');
  });

  it('emits only the name when the name is edited', async () => {
    await type(input('fieldName'), 'renamed');
    expect(host.updates).toEqual([{ name: 'renamed' }]);
  });

  it('emits the whole location when one coordinate changes', async () => {
    await type(input('left'), '42');
    expect(host.updates).toEqual([{ locations: { pageNumber: 1, left: 42, top: 700, width: 100, height: 50 } }]);
  });

  it('ignores an emptied number input instead of writing null into the field', async () => {
    await type(input('width'), '');
    expect(host.updates).toEqual([]);
  });

  it('never emits a negative coordinate', async () => {
    await type(input('top'), '-5');
    expect(host.updates).toEqual([{ locations: jasmine.objectContaining({ top: 0 }) }]);
  });

  it('follows a new field passed in from outside', async () => {
    host.field.set(makeField({ id: 'other', name: 'other_name' }));
    await settle();
    expect(input('fieldName').value).toBe('other_name');
  });

  it('emits when Delete is clicked', () => {
    root.querySelector<HTMLButtonElement>('button.ant-btn-dangerous')!.click();
    expect(host.deletes).toBe(1);
  });
});
