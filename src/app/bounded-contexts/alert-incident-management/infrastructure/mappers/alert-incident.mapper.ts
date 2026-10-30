import { Acknowledgement, Alert, AlertSeverity, CoreAlertSeverity, IncidentDetail } from '../../domain/models/alert.models';
import { AcknowledgementDto, AlertDto, IncidentDetailDto } from '../api/alert-incident.dto';

const VISUAL_SEVERITY: Record<CoreAlertSeverity, AlertSeverity> = {
  LOW: 'INFO', MEDIUM: 'WARNING', HIGH: 'CRITICAL', CRITICAL: 'CRITICAL',
};

export function alertFromDto(dto: AlertDto): Alert {
  if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(dto.severity)) throw new Error('Unknown alert severity');
  if (!['PENDING', 'ACKNOWLEDGED', 'ESCALATED', 'CLOSED'].includes(dto.status)) throw new Error('Unknown alert status');
  return {
    id: dto.id, incidentId: dto.incidentId, monitoringZoneId: dto.monitoringZoneId,
    // The composition layer resolves the real zone name; an identifier is an honest interim fallback.
    zoneName: dto.monitoringZoneId, severity: VISUAL_SEVERITY[dto.severity], severityLevel: dto.severity,
    status: dto.status, message: dto.message, raisedAt: dto.raisedAt,
  };
}
export function acknowledgementFromDto(dto: AcknowledgementDto): Acknowledgement {
  return { alertId: dto.alertId, acknowledgedAt: dto.acknowledgedAt, userId: dto.acknowledgedBy };
}
export function incidentDetailFromDto(dto: IncidentDetailDto): IncidentDetail {
  return {
    incident: dto.incident, alert: dto.alert ? alertFromDto(dto.alert) : null,
    acknowledgement: dto.acknowledgement ? { userId: dto.acknowledgement.acknowledgedBy,
      acknowledgedAt: dto.acknowledgement.acknowledgedAt, note: dto.acknowledgement.note } : null,
    correctiveActions: dto.correctiveActions,
    withinSafeRange: dto.withinSafeRange === true, resolutionAllowed: dto.resolutionAllowed === true,
  };
}
