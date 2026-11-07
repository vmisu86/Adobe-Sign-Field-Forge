import { TestBed } from '@angular/core/testing';
import { APP_ICONS } from './icons';
import { FieldTypeService } from './services/field-type.service';

describe('APP_ICONS', () => {
  const registered = new Set(APP_ICONS.map((icon) => icon.name));

  it('includes the icon of every field type preset and the fallback', () => {
    const presets = TestBed.inject(FieldTypeService).getFieldTypeCombinations();
    const wanted = new Set([...presets.map((preset) => preset.icon), 'question']);
    const missing = [...wanted].filter((name) => !registered.has(name));
    expect(missing).toEqual([]);
  });

  it('includes the icons the templates name directly', () => {
    const inTemplates = [
      'file-pdf',
      'menu-fold',
      'menu-unfold',
      'upload',
      'download',
      'export',
      'code',
      'left',
      'right',
      'table',
      'block',
      'undo',
      'redo',
      'search',
      'delete',
    ];
    expect(inTemplates.filter((name) => !registered.has(name))).toEqual([]);
  });
});
