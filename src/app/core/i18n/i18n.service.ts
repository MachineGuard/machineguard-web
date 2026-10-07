import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import en from '../../../i18n/en.json';
import es from '../../../i18n/es.json';

export type Language = 'es' | 'en';
export type TranslationKey = keyof typeof es;
type Params = Record<string, string | number>;

const DICTIONARIES: Record<Language, Record<string, string>> = { es, en };
const LOCALES: Record<Language, string> = { es: 'es-PE', en: 'en-US' };
const STORAGE_KEY = 'machineguard.language';

/**
 * Translations live in src/i18n/<language>.json. Reading `t` inside a template or a `computed`
 * tracks the language signal, so the text follows the selected language without a reload.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly current = signal<Language>(readStoredLanguage());

  readonly language = this.current.asReadonly();
  private readonly dateTimeFormat = computed(
    () => new Intl.DateTimeFormat(LOCALES[this.current()], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }),
  );
  private readonly timeFormat = computed(
    () => new Intl.DateTimeFormat(LOCALES[this.current()], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
  );

  constructor() {
    effect(() => (this.document.documentElement.lang = this.current()));
  }

  use(language: Language): void {
    this.current.set(language);
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // The choice still applies for this visit.
    }
  }

  /** Unknown keys are returned as written, which keeps server-provided text usable. */
  t(key: string, params?: Params): string {
    const text = DICTIONARIES[this.current()][key] ?? DICTIONARIES.es[key] ?? key;
    return params ? text.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match)) : text;
  }

  /** Picks `<key>.one` or `<key>.other` by count and exposes the count as `{n}`. */
  plural(key: string, count: number, params?: Params): string {
    return this.t(`${key}.${count === 1 ? 'one' : 'other'}`, { ...params, n: count });
  }

  dateTime(iso: string): string {
    return this.dateTimeFormat().format(new Date(iso)).replace(',', '');
  }

  time(iso: string): string {
    return this.timeFormat().format(new Date(iso));
  }

  elapsed(iso: string | null): string {
    if (!iso) return this.t('elapsed.none');
    const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000));
    if (seconds < 60) return this.t('elapsed.now');
    if (seconds < 3600) return this.t('elapsed.minutes', { n: Math.floor(seconds / 60) });
    if (seconds < 86400) return this.t('elapsed.hours', { n: Math.floor(seconds / 3600) });
    return this.t('elapsed.days', { n: Math.floor(seconds / 86400) });
  }
}

function readStoredLanguage(): Language {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'es';
  } catch {
    return 'es';
  }
}
