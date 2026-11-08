import { ChangeDetectionStrategy, Component, inject, input, linkedSignal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { Field } from '../../models/field.model';
import { FieldTypeService } from '../../services/field-type.service';

type LocationKey = 'left' | 'top' | 'width' | 'height';

@Component({
  selector: 'app-field-property-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzInputModule, NzSelectModule, NzCheckboxModule, NzButtonModule, NzIconModule],
  templateUrl: './field-property-form.component.html',
})
export class FieldPropertyFormComponent {
  protected readonly fieldTypeService = inject(FieldTypeService);

  readonly field = input.required<Field>();
  readonly fieldUpdated = output<Partial<Field>>();
  readonly deleteClicked = output<void>();

  /** What the inputs show; follows `field` and is edited without touching the original. */
  protected readonly localField = linkedSignal<Field>(() => {
    const field = this.field();
    return { ...field, locations: { ...field.locations } };
  });

  protected onNameChange(name: string): void {
    this.localField.update((field) => ({ ...field, name }));
    this.fieldUpdated.emit({ name });
  }

  protected onLocationChange(key: LocationKey, value: number | null): void {
    // An emptied or half-typed number input reports null / NaN: wait for a real number.
    if (value === null || !Number.isFinite(value)) return;

    const locations = { ...this.localField().locations, [key]: Math.max(0, value) };
    this.localField.update((field) => ({ ...field, locations }));
    this.fieldUpdated.emit({ locations });
  }

  protected onRecipientChange(recipientIndex: number): void {
    this.localField.update((field) => ({ ...field, recipientIndex }));
    this.fieldUpdated.emit({ recipientIndex });
  }

  protected onRequiredChange(required: boolean): void {
    this.localField.update((field) => ({ ...field, required }));
    this.fieldUpdated.emit({ required });
  }

  protected onReadOnlyChange(readOnly: boolean): void {
    this.localField.update((field) => ({ ...field, readOnly }));
    this.fieldUpdated.emit({ readOnly });
  }
}
