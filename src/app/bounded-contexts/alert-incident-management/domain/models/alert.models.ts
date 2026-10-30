export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type CoreAlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'PENDING' | 'ACKNOWLEDGED' | 'ESCALATED' | 'CLOSED';
export type IncidentStatus = 'OPEN' | 'ACKNOWLEDGED' | 'ESCALATED' | 'RESOLVED';
export interface Alert {
  id: string;
  incidentId?: string;
  monitoringZoneId: string;
  zoneName: string;
  message: string;
  severity: AlertSeverity;
  severityLevel?: CoreAlertSeverity;
  status: AlertStatus;
  raisedAt: string;
  contextNote?: string;
}
export interface Acknowledgement {
  alertId: string;
  acknowledgedAt: string;
  userId?: string;
}
export interface Escalation {
  alertId: string;
  escalatedAt: string;
  reason: string;
}
export interface Incident {
  id: string;
  originMeasurementId: string;
  monitoringZoneId: string;
  environmentalVariable: 'TEMPERATURE' | 'HUMIDITY' | null;
  status: IncidentStatus;
  openedAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNotes: string | null;
}
export interface CorrectiveAction {
  id: string;
  incidentId: string;
  description: string;
  performedBy: string;
  performedAt: string;
  notes: string | null;
}
export interface IncidentDetail {
  incident: Incident;
  alert: Alert | null;
  acknowledgement: { userId: string; acknowledgedAt: string; note: string | null } | null;
  correctiveActions: CorrectiveAction[];
  withinSafeRange: boolean;
  resolutionAllowed: boolean;
}
