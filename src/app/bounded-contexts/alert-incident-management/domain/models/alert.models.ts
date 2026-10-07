export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertStatus = 'PENDING' | 'ACKNOWLEDGED' | 'ESCALATED' | 'CLOSED';
export type IncidentStatus = 'OPEN' | 'ACKNOWLEDGED' | 'ESCALATED' | 'RESOLVED';
export interface Alert {
  id: string;
  monitoringZoneId: string;
  zoneName: string;
  message: string;
  severity: AlertSeverity;
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
  alertIds: string[];
  status: IncidentStatus;
  openedAt: string;
}
export interface CorrectiveAction {
  id: string;
  incidentId: string;
  description: string;
  recordedAt: string;
}
