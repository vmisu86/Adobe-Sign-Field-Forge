import { EnvironmentProviders, importProvidersFrom, Provider } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { en_US, provideNzI18n } from 'ng-zorro-antd/i18n';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { APP_ICONS } from '../icons';

/** What ng-zorro components need to render in a test: animations, locale and the app's icons. */
export function provideTestApp(): (Provider | EnvironmentProviders)[] {
  return [provideNoopAnimations(), provideNzI18n(en_US), provideNzIcons(APP_ICONS), importProvidersFrom(NzModalModule)];
}
