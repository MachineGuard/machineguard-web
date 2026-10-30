import { AlertStatus, CoreAlertSeverity, CorrectiveAction, Incident } from '../../domain/models/alert.models';

export interface AlertDto {
  id: string;
  incidentId: string;
  monitoringZoneId: string;
  severity: CoreAlertSeverity;
  status: AlertStatus;
  message: string;
  raisedAt: string;
  acknowledgedAt: string | null;
  escalatedAt: string | null;
}
export interface AcknowledgementDto {
  alertId: string;
  incidentId: string;
  acknowledgedBy: string;
  acknowledgedAt: string;
  note: string | null;
  alertStatus: AlertStatus;
}
export interface IncidentDetailDto {
  incident: Incident;
  alert: AlertDto | null;
  acknowledgement: { acknowledgedBy: string; acknowledgedAt: string; note: string | null } | null;
  correctiveActions: CorrectiveAction[];
  withinSafeRange: boolean;
  resolutionAllowed: boolean;
}
