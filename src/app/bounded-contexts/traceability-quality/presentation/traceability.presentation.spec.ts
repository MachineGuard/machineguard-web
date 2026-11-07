import { HttpErrorResponse } from '@angular/common/http';
import { utcPeriod, traceabilityError } from './traceability.presentation';
import { reportFilename } from '../infrastructure/report-filename';

describe('Traceability presentation boundaries', () => {
  it('converts local dates to UTC without rounding or shortening', () => {
    const from = '2026-11-06T01:02:03', to = '2026-11-06T04:05:06';
    expect(utcPeriod(from, to)).toEqual({ from: new Date(2026,10,6,1,2,3).toISOString(), to: new Date(2026,10,6,4,5,6).toISOString() });
    expect(utcPeriod('2026-11-06T10:00:00-05:00','2026-11-06T11:00:00-05:00')).toEqual({from:'2026-11-06T15:00:00.000Z',to:'2026-11-06T16:00:00.000Z'});
  });
  it('rejects missing, invalid, equal or inverted dates and leaves server limits to Core', () => {
    for (const [from,to] of [['','x'],['x','y'],['2026-11-06','2026-11-06'],['2026-11-07','2026-11-06']]) expect(utcPeriod(from,to)).toBeNull();
    expect(utcPeriod('2020-01-01','2026-11-06')).not.toBeNull();
    expect(utcPeriod('2026-02-31T10:00','2026-03-05T11:00')).toBeNull();
  });
  it('distinguishes authorization, missing evidence, invalid filters and integrity failures', () => {
    for (const [status,key] of [[400,'invalid'],[401,'unauthorized'],[403,'forbidden'],[404,'notFound'],[409,'integrityError'],[503,'unavailable']] as const) {
      expect(traceabilityError(new HttpErrorResponse({status}))).toBe('trace.'+key);
    }
  });
  it('uses a safe JSON filename and handles missing or malformed disposition', () => {
    expect(reportFilename('attachment; filename="report.json"','fallback.json')).toBe('report.json');
    expect(reportFilename("attachment; filename*=UTF-8''r%C3%A9sum%C3%A9.json",'fallback.json')).toBe('résumé.json');
    expect(reportFilename('attachment; filename="../../unsafe.json"','fallback.json')).not.toContain('/');
    expect(reportFilename("attachment; filename*=UTF-8''%ZZ",'fallback.json')).toBe('fallback.json');
    expect(reportFilename('attachment; filename="evil.html"','fallback.json')).toBe('fallback.json');
    expect(reportFilename(null,'fallback.json')).toBe('fallback.json');
    expect(reportFilename('attachment; filename="CON.json"','fallback.json')).toBe('fallback.json');
  });
});
