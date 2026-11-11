import { StatusTone } from '../../../shared/components/status-badge/status-badge.component';
import { AlertSeverity, IncidentDetail } from '../domain/models/alert.models';

export function incidentTone(status: string): StatusTone {
  return status === 'RESOLVED' || status === 'CLOSED' ? 'normal'
    : status === 'ACKNOWLEDGED' ? 'near-limit' : 'out-of-range';
}

export function severityTone(severity: AlertSeverity): StatusTone {
  return severity === 'CRITICAL' ? 'out-of-range' : severity === 'WARNING' ? 'near-limit' : 'normal';
}

/** Elapsed time as "5 min", "2 h 10 min" or "1 d 3 h"; never negative. */
export function formatElapsed(from: string | null | undefined, to: Date): string {
  if (!from) return '—';
  const minutes = Math.max(0, Math.floor((to.getTime() - new Date(from).getTime()) / 60_000));
  const days = Math.floor(minutes / 1440);
  if (days > 0) return `${days} d ${Math.floor((minutes % 1440) / 60)} h`;
  return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`;
}

export type TimelineKey = 'raised' | 'acknowledged' | 'escalated' | 'action' | 'resolved';
export interface TimelineStep { id: string; key: TimelineKey; at: string | null; detail: string | null; done: boolean; }

/** Builds the incident timeline from the detail the Core already returns: raised, acknowledged, escalated, actions, resolved. */
export function incidentTimeline(detail: IncidentDetail): TimelineStep[] {
  const { incident, alert, acknowledgement, correctiveActions } = detail;
  const steps: TimelineStep[] = [
    { id: 'raised', key: 'raised', at: alert?.raisedAt ?? incident.openedAt, detail: alert?.message ?? null, done: true },
    { id: 'acknowledged', key: 'acknowledged', at: acknowledgement?.acknowledgedAt ?? null, detail: acknowledgement?.note ?? null, done: !!acknowledgement },
  ];
  if (alert?.escalatedAt) steps.push({ id: 'escalated', key: 'escalated', at: alert.escalatedAt, detail: null, done: true });
  if (correctiveActions.length) {
    [...correctiveActions].sort((a, b) => a.performedAt.localeCompare(b.performedAt)).forEach(action =>
      steps.push({ id: 'action-' + action.id, key: 'action', at: action.performedAt, detail: action.description, done: true }));
  } else {
    steps.push({ id: 'action', key: 'action', at: null, detail: null, done: false });
  }
  steps.push({ id: 'resolved', key: 'resolved', at: incident.resolvedAt, detail: incident.resolutionNotes, done: incident.status === 'RESOLVED' });
  return steps;
}
