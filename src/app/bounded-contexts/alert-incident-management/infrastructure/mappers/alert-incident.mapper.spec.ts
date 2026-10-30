import { alertFromDto, acknowledgementFromDto, incidentDetailFromDto } from './alert-incident.mapper';
import { AlertDto } from '../api/alert-incident.dto';
import { ALERT_FIXTURE, DETAIL_FIXTURE } from '../testing/alert-incident.fixtures';

describe('Alert and incident transport mapping', () => {
  it('preserves business severity while using the incumbent visual vocabulary', () => {
    expect(alertFromDto(ALERT_FIXTURE)).toEqual(jasmine.objectContaining({
      id: 'alert-1', incidentId: 'incident-1', monitoringZoneId: 'zone-1', severityLevel: 'HIGH', severity: 'CRITICAL',
    }));
    expect(alertFromDto({ ...ALERT_FIXTURE, severity: 'LOW' }).severity).toBe('INFO');
    expect(alertFromDto({ ...ALERT_FIXTURE, severity: 'MEDIUM' }).severity).toBe('WARNING');
  });
  it('maps the authenticated acknowledgement author rather than inventing one', () => {
    expect(acknowledgementFromDto({ alertId: 'a', incidentId: 'i', acknowledgedBy: 'real-user',
      acknowledgedAt: '2026-10-30T12:00:00Z', note: null, alertStatus: 'ACKNOWLEDGED' }).userId).toBe('real-user');
  });
  it('rejects an unknown server severity instead of presenting a fake normal state', () => {
    expect(() => alertFromDto({ ...ALERT_FIXTURE, severity: 'UNKNOWN' } as unknown as AlertDto)).toThrow();
  });
  it('preserves unavailable and denied resolution states and null optional resources', () => {
    const detail = incidentDetailFromDto({ ...DETAIL_FIXTURE, alert: null });
    expect(detail.withinSafeRange).toBeFalse(); expect(detail.resolutionAllowed).toBeFalse();
    expect(detail.alert).toBeNull(); expect(detail.acknowledgement).toBeNull();
    expect(incidentDetailFromDto({ ...DETAIL_FIXTURE, withinSafeRange: true, resolutionAllowed: true }).resolutionAllowed).toBeTrue();
  });
});
