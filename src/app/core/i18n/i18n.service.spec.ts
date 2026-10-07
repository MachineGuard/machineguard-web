import { TestBed } from '@angular/core/testing';
import en from '../../../i18n/en.json';
import es from '../../../i18n/es.json';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  beforeEach(() => localStorage.removeItem('machineguard.language'));
  afterEach(() => localStorage.removeItem('machineguard.language'));

  it('keeps both dictionaries complete and with the same placeholders', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
    for (const key of Object.keys(es) as (keyof typeof es)[]) {
      expect(es[key].trim()).withContext(key).not.toBe('');
      expect(en[key].trim()).withContext(key).not.toBe('');
      expect(placeholders(en[key])).withContext(key).toEqual(placeholders(es[key]));
    }
  });

  it('starts in Spanish, switches language and remembers the choice', () => {
    const i18n = TestBed.inject(I18nService);
    expect(i18n.language()).toBe('es');
    expect(i18n.t('nav.zones')).toBe('Zonas');
    i18n.use('en');
    expect(i18n.t('nav.zones')).toBe('Zones');
    TestBed.flushEffects();
    expect(document.documentElement.lang).toBe('en');
    TestBed.resetTestingModule();
    expect(TestBed.inject(I18nService).language()).toBe('en');
  });

  it('interpolates parameters, picks plural forms and leaves unknown keys untouched', () => {
    const i18n = TestBed.inject(I18nService);
    expect(i18n.t('dashboard.updated', { n: 12 })).toBe('Actualizado hace 12 s');
    expect(i18n.plural('card.nodes.online', 1)).toBe('1 nodo en línea');
    expect(i18n.plural('card.nodes.online', 3)).toBe('3 nodos en línea');
    expect(i18n.t('Facility Lead')).toBe('Facility Lead');
    expect(i18n.elapsed(null)).toBe('Aún sin mediciones');
  });
});
