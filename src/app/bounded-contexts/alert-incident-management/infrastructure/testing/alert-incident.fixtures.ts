import { AlertDto, IncidentDetailDto } from '../api/alert-incident.dto';

export const ALERT_FIXTURE: AlertDto = {
  id: 'alert-1', incidentId: 'incident-1', monitoringZoneId: 'zone-1', severity: 'HIGH', status: 'PENDING',
  message: 'Temperature outside safe range', raisedAt: '2026-10-30T12:00:00Z', acknowledgedAt: null, escalatedAt: null,
};
export const DETAIL_FIXTURE: IncidentDetailDto = {
  incident: { id: 'incident-1', originMeasurementId: 'measurement-1', monitoringZoneId: 'zone-1',
    environmentalVariable: 'TEMPERATURE', status: 'OPEN', openedAt: '2026-10-30T12:00:00Z', resolvedAt: null,
    resolvedBy: null, resolutionNotes: null },
  alert: ALERT_FIXTURE, acknowledgement: null, correctiveActions: [], withinSafeRange: false, resolutionAllowed: false,
};
