import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { EditorStateService } from '../../services/editor-state.service';
import { FieldEditorService } from '../../services/field-editor.service';
import { FieldPropertyFormComponent } from '../field-property-form/field-property-form.component';

@Component({
  selector: 'app-field-properties-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzLayoutModule, NzEmptyModule, FieldPropertyFormComponent],
  templateUrl: './field-properties-sidebar.component.html',
  styleUrls: ['./field-properties-sidebar.component.less'],
})
export class FieldPropertiesSidebarComponent {
  protected readonly state = inject(EditorStateService);
  protected readonly editor = inject(FieldEditorService);
}
