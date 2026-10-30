import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_CONFIG } from '../../../../core/config/api.config';
import { ApiIncidentRepository } from './api-incident.repository';
import { DETAIL_FIXTURE } from '../testing/alert-incident.fixtures';

describe('ApiIncidentRepository', () => {
  let repository: ApiIncidentRepository;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), ApiIncidentRepository,
      { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } }] });
    repository = TestBed.inject(ApiIncidentRepository); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('sends zone and status filters without client-supplied identity', () => {
    repository.list({ monitoringZoneId: 'zone-1', status: 'OPEN' }).subscribe();
    const request = http.expectOne(req => req.url === '/api/v1/incidents');
    expect(request.request.params.keys().sort()).toEqual(['limit', 'monitoringZoneId', 'status']);
    expect(request.request.params.get('status')).toBe('OPEN'); request.flush([]);
  });
  it('loads the eligibility and corrective evidence in the domain detail', () => {
    repository.detail('incident-1').subscribe(detail => {
      expect(detail.incident.originMeasurementId).toBe('measurement-1'); expect(detail.resolutionAllowed).toBeFalse();
    });
    http.expectOne('/api/v1/incidents/incident-1').flush(DETAIL_FIXTURE);
  });
  it('does not submit an author or organization with corrective actions', () => {
    repository.registerAction('incident-1', 'Repaired cooling', 'Follow up').subscribe();
    const request = http.expectOne('/api/v1/incidents/incident-1/corrective-actions');
    expect(request.request.body).toEqual({ description: 'Repaired cooling', notes: 'Follow up' });
    request.flush({});
  });
  it('surfaces a stale-state resolution conflict for the page to explain', () => {
    let status = 0;
    repository.resolve('incident-1').subscribe({ error: error => status = error.status });
    http.expectOne('/api/v1/incidents/incident-1/resolve').flush({}, { status: 409, statusText: 'Conflict' });
    expect(status).toBe(409);
  });
});
