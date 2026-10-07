import { inject, Pipe, PipeTransform } from '@angular/core';
import { I18nService } from './i18n.service';

/** `{{ 'zones.title' | t }}` or `{{ 'dashboard.updated' | t: { n: 12 } }}`. Impure so a language change re-renders. */
@Pipe({ name: 't', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: string, params?: Record<string, string | number>): string {
    return this.i18n.t(key, params);
  }
}
