import { HttpClient, provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_CONFIG } from '../../../../core/config/api.config';
import { apiContextInterceptor } from '../../../../core/interceptors/api-context.interceptor';
import { ACCESS_TOKEN_PROVIDER } from '../../../iam/application/ports/access-token.provider';
import { SessionService } from '../../../iam/application/services/session.service';
import { ConfiguredAccessTokenProvider } from '../../../iam/infrastructure/auth/configured-access-token.provider';
import { SessionStore } from '../../../iam/infrastructure/auth/session.store';
import { sessionRefreshInterceptor } from '../../../iam/infrastructure/interceptors/session-refresh.interceptor';
import { TraceabilityApiClient } from './traceability-api.client';

describe('Traceability HTTP contracts with IAM', () => {
  let api: TraceabilityApiClient; let http: HttpTestingController;
  const base = '/api/v1';
  const authentication = (n: number) => ({ accessToken: 'access-'+n, refreshToken: 'refresh-'+n,
    user: { id: 'u', organizationId: 'o', role: 'ADMIN' }, organization: { id: 'o', name: 'Test' } });
  beforeEach(() => {
    sessionStorage.removeItem(SessionStore.storageKey);
    TestBed.configureTestingModule({ providers: [provideRouter([]),
      provideHttpClient(withXhr(), withInterceptors([sessionRefreshInterceptor, apiContextInterceptor])), provideHttpClientTesting(),
      { provide: API_CONFIG, useValue: { baseUrl: base, developmentTokenEnabled: false } },
      { provide: ACCESS_TOKEN_PROVIDER, useExisting: ConfiguredAccessTokenProvider },
    ] });
    api = TestBed.inject(TraceabilityApiClient); http = TestBed.inject(HttpTestingController);
    TestBed.inject(SessionService).login({ email: 'test@example.invalid', password: 'synthetic' }).subscribe();
    http.expectOne(base+'/auth/login').flush(authentication(1));
  });
  afterEach(() => { http.verify(); sessionStorage.removeItem(SessionStore.storageKey); });
  it('sends exact history filters without invented point/pagination/identity parameters', () => {
    api.history({ monitoringZoneId: 'zone', from: '2026-11-06T10:00:00Z', to: '2026-11-06T11:00:00Z', variable: 'HUMIDITY' }).subscribe();
    const r = http.expectOne(r => r.url === base+'/traceability/measurement-history');
    expect(r.request.params.keys().sort()).toEqual(['from','monitoringZoneId','to','variable']);
    expect(r.request.params.get('variable')).toBe('HUMIDITY');
    expect(r.request.params.get('from')).toBe('2026-11-06T10:00:00Z');
    expect(r.request.headers.get('Authorization')).toBe('Bearer access-1'); r.flush({ count: 0, measurements: [] });
  });
  it('omits absent optional filters and reads summary then detail on separate requests', () => {
    api.reports().subscribe(); const list = http.expectOne(base+'/traceability/reports'); expect(list.request.params.keys()).toEqual([]); list.flush([]);
    api.reports('z').subscribe(); const filtered = http.expectOne(base+'/traceability/reports?monitoringZoneId=z'); filtered.flush([]);
    api.report('r').subscribe(); http.expectOne(base+'/traceability/reports/r').flush({ content: { stored: true } });
    api.history({ monitoringZoneId: 'z', from: 'a', to: 'b' }).subscribe();
    const history = http.expectOne(r => r.url.endsWith('/measurement-history')); expect(history.request.params.has('variable')).toBeFalse(); history.flush({});
  });
  it('renews a blob GET without Bearer on refresh and downloads with the rotated Bearer', () => {
    const received: Blob[] = [];
    api.download('report').subscribe(response => { if (response.body) received.push(response.body); });
    const first = http.expectOne(base+'/traceability/reports/report/download');
    expect(first.request.responseType).toBe('blob'); expect(first.request.headers.get('Authorization')).toBe('Bearer access-1');
    first.flush(null, { status: 401, statusText: 'Unauthorized' });
    const refresh = http.expectOne(base+'/auth/refresh'); expect(refresh.request.headers.has('Authorization')).toBeFalse(); refresh.flush(authentication(2));
    const replay = http.expectOne(base+'/traceability/reports/report/download');
    expect(replay.request.headers.get('Authorization')).toBe('Bearer access-2');
    const blob = new Blob(['{"id":"report","content":{}}'], { type: 'application/json' }); replay.flush(blob);
    expect(received).toEqual([blob]);
  });
  it('does not replay report generation after a 401 or lost response', () => {
    for (const status of [401, 0, 503]) {
      let failure = false;
      const body = { monitoringZoneId: 'z', periodStart: '2026-11-06T10:00:00Z', periodEnd: '2026-11-06T11:00:00Z' };
      api.generate(body).subscribe({ error: () => failure = true });
      const r = http.expectOne(base+'/traceability/reports'); expect(r.request.method).toBe('POST'); expect(r.request.body).toEqual(body);
      r.flush(null, { status, statusText: 'Synthetic failure' });
      expect(failure).toBeTrue(); http.expectNone(base+'/auth/refresh'); http.expectNone(base+'/traceability/reports');
    }
  });
});
