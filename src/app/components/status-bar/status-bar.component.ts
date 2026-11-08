import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AdobeDocumentType } from '../../models/field.model';
import { CoordinateConversionService } from '../../services/coordinate-conversion.service';
import { EditorStateService } from '../../services/editor-state.service';
import { PdfDocumentService } from '../../services/pdf-document.service';

/**
 * The strip under the editor: which coordinate system the numbers are in, the page size, where the
 * mouse is (in those same numbers), and the zoom. It is how a precise placement is read off the page.
 */
@Component({
  selector: 'app-status-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-bar.component.html',
})
export class StatusBarComponent {
  protected readonly pdf = inject(PdfDocumentService);
  private readonly state = inject(EditorStateService);
  private readonly coords = inject(CoordinateConversionService);

  protected readonly coordinateSystem = computed(() =>
    this.state.documentType() === AdobeDocumentType.LIBRARY
      ? 'Library · Y from top of page'
      : 'Transient · Y from bottom of page',
  );

  protected readonly pageSize = computed(() => {
    const viewport = this.pdf.viewport();
    if (!viewport) return null;
    const width = Math.round(viewport.width / viewport.scale);
    const height = Math.round(this.coords.pageHeightPoints(viewport));
    return `${width} × ${height} pt`;
  });

  /** The mouse position as a field's `left` and `top` would be stored there (points). */
  protected readonly pointer = computed(() => {
    const viewport = this.pdf.viewport();
    const point = this.state.pointer();
    if (!viewport || !point) return null;
    const x = this.coords.pixelsToPoints(point.x, viewport.scale);
    const y = this.coords.convertYCoordinate(point.y, viewport, this.state.documentType());
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  });
}
