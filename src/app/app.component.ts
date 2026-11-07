import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PdfViewerComponent } from './components/pdf-viewer/pdf-viewer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PdfViewerComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  readonly title = 'FieldForge for Adobe Sign';
}
