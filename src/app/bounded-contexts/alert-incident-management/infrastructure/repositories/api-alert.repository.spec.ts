import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_CONFIG } from '../../../../core/config/api.config';
import { ApiAlertRepository } from './api-alert.repository';
import { ALERT_FIXTURE } from '../testing/alert-incident.fixtures';

describe('ApiAlertRepository', () => {
  let repository: ApiAlertRepository;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), ApiAlertRepository,
      { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } }] });
    repository = TestBed.inject(ApiAlertRepository); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('applies server filters with no tenant supplied by the page', () => {
    repository.list({ monitoringZoneId: 'zone-1', status: 'PENDING' }).subscribe();
    const request = http.expectOne(req => req.url === '/api/v1/alerts');
    expect(request.request.params.keys().sort()).toEqual(['monitoringZoneId', 'status']);
    request.flush([]);
  });

  it('polls real resources and preserves the last snapshot when a background refresh fails', fakeAsync(() => {
    let latest = '';
    const subscription = repository.watchLatest().subscribe(items => latest = items[0]?.status ?? '');
    tick(0); http.expectOne('/api/v1/alerts').flush([ALERT_FIXTURE]); expect(latest).toBe('PENDING');
    tick(15_000); http.expectOne('/api/v1/alerts').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(latest).toBe('PENDING');
    tick(15_000); http.expectOne('/api/v1/alerts').flush([{ ...ALERT_FIXTURE, status: 'CLOSED' }]);
    expect(latest).toBe('CLOSED'); subscription.unsubscribe();
  }));
  it('surfaces a failed first request instead of substituting mock data', fakeAsync(() => {
    let failed = false;
    repository.watchLatest().subscribe({ next: () => fail('Unexpected mock fallback'), error: () => failed = true });
    tick(0); http.expectOne('/api/v1/alerts').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(failed).toBeTrue();
  }));
  it('maps the acknowledgement and refreshes only after a confirmed command', fakeAsync(() => {
    const subscription = repository.watchLatest().subscribe();
    tick(0); http.expectOne('/api/v1/alerts').flush([ALERT_FIXTURE]);
    let author = '';
    repository.acknowledge('alert-1').subscribe(ack => author = ack.userId ?? '');
    const request = http.expectOne('/api/v1/alerts/alert-1/acknowledgements');
    expect(request.request.method).toBe('POST'); expect(request.request.body).toEqual({});
    request.flush({ alertId: 'alert-1', incidentId: 'incident-1', acknowledgedBy: 'operator-1',
      acknowledgedAt: '2026-10-30T12:01:00Z', note: null, alertStatus: 'ACKNOWLEDGED' });
    expect(author).toBe('operator-1');
    http.expectOne('/api/v1/alerts').flush([{ ...ALERT_FIXTURE, status: 'ACKNOWLEDGED' }]);
    subscription.unsubscribe();
  }));
});
