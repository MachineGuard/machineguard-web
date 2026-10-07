import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ALERT_REPOSITORY } from '../../../alert-incident-management/domain/repositories/alert.repository';
import { MockAlertRepository } from '../../../alert-incident-management/infrastructure/repositories/mock-alert.repository';
import { DashboardFacade } from '../../../../dashboard/services/dashboard.facade';
import { API_CONFIG } from '../../../../core/config/api.config';
import { MONITORING_REPOSITORY } from '../../domain/repositories/monitoring.repository';
import { EnvironmentalMonitoringService } from '../../application/services/environmental-monitoring.service';
import { MonitoringLoadState } from '../../application/models/monitoring-load-state';
import { ApiMonitoringRepository } from './api-monitoring.repository';
import { zoneFixture } from '../api/monitoring-zone.fixture';

const url = '/api/v1/environmental-monitoring/zones';
describe('HTTP monitoring dashboard composition', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(),
      { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } },
      { provide: MONITORING_REPOSITORY, useClass: ApiMonitoringRepository },
      { provide: ALERT_REPOSITORY, useClass: MockAlertRepository },
    ] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('shares one request between dashboard and sidebar and transitions from loading to loaded', () => {
    const service = TestBed.inject(EnvironmentalMonitoringService);
    const states: MonitoringLoadState[] = [];
    const stateSubscription = service.state$.subscribe(state => states.push(state));
    const sidebar = service.zones$.subscribe();
    const dashboard = TestBed.inject(DashboardFacade).viewModel$.subscribe(vm => {
      expect(vm.zones[0].temperature).toBe(11.2); expect(vm.zones[0].humidity).toBe(50);
      expect(vm.summary[0].count).toBe(1); expect(vm.alerts).toEqual([]);
    });
    expect(states[0].status).toBe('loading');
    const request = http.expectOne(url); expect(request.request.method).toBe('GET'); request.flush([zoneFixture()]);
    expect(states[states.length - 1].status).toBe('loaded');
    stateSubscription.unsubscribe(); sidebar.unsubscribe(); dashboard.unsubscribe();
  });
  it('exposes empty responses as empty, without falling back to mock zones', () => {
    const states: MonitoringLoadState[] = [];
    const subscription = TestBed.inject(EnvironmentalMonitoringService).state$.subscribe(state => states.push(state));
    http.expectOne(url).flush([]);
    expect(states[states.length - 1]).toEqual({ status: 'empty', zones: [] }); subscription.unsubscribe();
  });
  it('propagates authentication failures to the existing dashboard error state', () => {
    const states: MonitoringLoadState[] = [];
    const service = TestBed.inject(EnvironmentalMonitoringService);
    const subscription = service.state$.subscribe(state => states.push(state));
    let failed = false;
    const dashboard = TestBed.inject(DashboardFacade).viewModel$.subscribe({ error: () => failed = true });
    http.expectOne(url).flush({ detail: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    expect(states[states.length - 1].status).toBe('error'); expect(failed).toBeTrue();
    subscription.unsubscribe(); dashboard.unsubscribe();
  });
});
