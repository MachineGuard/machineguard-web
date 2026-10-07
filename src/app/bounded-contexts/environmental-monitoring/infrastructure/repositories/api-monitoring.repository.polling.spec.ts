import { discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_CONFIG } from '../../../../core/config/api.config';
import { zoneFixture } from '../api/monitoring-zone.fixture';
import { MonitoringApiClient } from '../api/monitoring-api.client';
import { ApiMonitoringRepository, SNAPSHOT_REFRESH_MS } from './api-monitoring.repository';

const zonesUrl = '/api/v1/environmental-monitoring/zones';

describe('Environmental Monitoring HTTP access', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), ApiMonitoringRepository,
      { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } },
    ] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('refreshes the snapshot on an interval and keeps the last one when a refresh fails', fakeAsync(() => {
    const zoneCounts: number[] = [];
    let failed = false;
    const subscription = TestBed.inject(ApiMonitoringRepository).watchSnapshot()
      .subscribe({ next: (snapshot) => zoneCounts.push(snapshot.zones.length), error: () => (failed = true) });
    http.expectOne(zonesUrl).flush([zoneFixture()]);
    tick(SNAPSHOT_REFRESH_MS);
    http.expectOne(zonesUrl).flush(null, { status: 503, statusText: 'Service Unavailable' });
    tick(SNAPSHOT_REFRESH_MS);
    http.expectOne(zonesUrl).flush([zoneFixture(), zoneFixture()]);
    expect(zoneCounts).toEqual([1, 2]);
    expect(failed).toBeFalse();
    subscription.unsubscribe();
    discardPeriodicTasks();
  }));

  it('reports a failed first load so the dashboard can show its error state', () => {
    let status = 0;
    TestBed.inject(ApiMonitoringRepository).watchSnapshot().subscribe({ error: (error) => (status = error.status) });
    http.expectOne(zonesUrl).flush(null, { status: 500, statusText: 'Server Error' });
    expect(status).toBe(500);
  });

  it('sends configuration through the documented Core API routes', () => {
    const client = TestBed.inject(MonitoringApiClient);
    client.registerZone({ name: 'Cámara fría A', description: null }).subscribe();
    const zone = http.expectOne(zonesUrl);
    expect(zone.request.method).toBe('POST');
    zone.flush(zoneFixture());
    client.registerPoint('z1', { name: 'Punto 1', location: null }).subscribe();
    http.expectOne({ method: 'POST', url: `${zonesUrl}/z1/points` }).flush({});
    client.registerSensor('z1', 'p1', { deviceCode: 'MG-01', samplingIntervalSeconds: 60 }).subscribe();
    http.expectOne({ method: 'POST', url: `${zonesUrl}/z1/points/p1/sensors` }).flush({});
    client.configureThreshold('z1', 'TEMPERATURE', { minimumValue: 2, maximumValue: 8 }).subscribe();
    const threshold = http.expectOne({ method: 'PUT', url: `${zonesUrl}/z1/thresholds/TEMPERATURE` });
    expect(threshold.request.body).toEqual({ minimumValue: 2, maximumValue: 8 });
    threshold.flush({});
  });
});
