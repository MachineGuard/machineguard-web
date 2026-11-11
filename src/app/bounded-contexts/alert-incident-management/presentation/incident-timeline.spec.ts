import { IncidentDetail } from '../domain/models/alert.models';
import { incidentDetailFromDto } from '../infrastructure/mappers/alert-incident.mapper';
import { DETAIL_FIXTURE } from '../infrastructure/testing/alert-incident.fixtures';
import { formatElapsed, incidentTimeline, severityTone } from './incident.presentation';

describe('incident timeline helpers', () => {
  const base = (): IncidentDetail => incidentDetailFromDto(DETAIL_FIXTURE);

  it('formats elapsed time in minutes, hours and days and never goes negative', () => {
    const t0 = '2026-11-10T12:00:00Z';
    expect(formatElapsed(t0, new Date('2026-11-10T12:05:00Z'))).toBe('5 min');
    expect(formatElapsed(t0, new Date('2026-11-10T14:10:00Z'))).toBe('2 h 10 min');
    expect(formatElapsed(t0, new Date('2026-11-11T15:00:00Z'))).toBe('1 d 3 h');
    expect(formatElapsed(t0, new Date('2026-11-10T11:57:00Z'))).toBe('0 min');
    expect(formatElapsed(null, new Date())).toBe('—');
  });

  it('maps visual severity to a status tone', () => {
    expect(severityTone('CRITICAL')).toBe('out-of-range');
    expect(severityTone('WARNING')).toBe('near-limit');
    expect(severityTone('INFO')).toBe('normal');
  });

  it('marks raised as done and the rest as pending for a fresh incident', () => {
    const steps = incidentTimeline({ ...base(), acknowledgement: null, correctiveActions: [] });
    expect(steps.map(s => s.key)).toEqual(['raised', 'acknowledged', 'action', 'resolved']);
    expect(steps.map(s => s.done)).toEqual([true, false, false, false]);
  });

  it('orders corrective actions by time and adds escalation and resolution', () => {
    const detail = base();
    const full: IncidentDetail = {
      ...detail,
      incident: { ...detail.incident, status: 'RESOLVED', resolvedAt: '2026-10-30T14:00:00Z', resolutionNotes: 'Door sealed' },
      alert: { ...detail.alert!, escalatedAt: '2026-10-30T12:30:00Z' },
      acknowledgement: { userId: 'u1', acknowledgedAt: '2026-10-30T12:05:00Z', note: 'On my way' },
      correctiveActions: [
        { id: 'b', incidentId: detail.incident.id, description: 'second', performedBy: 'u1', performedAt: '2026-10-30T13:00:00Z', notes: null },
        { id: 'a', incidentId: detail.incident.id, description: 'first', performedBy: 'u1', performedAt: '2026-10-30T12:40:00Z', notes: null },
      ],
    };
    const steps = incidentTimeline(full);
    expect(steps.map(s => s.key)).toEqual(['raised', 'acknowledged', 'escalated', 'action', 'action', 'resolved']);
    expect(steps.filter(s => s.key === 'action').map(s => s.detail)).toEqual(['first', 'second']);
    expect(steps[1].detail).toBe('On my way');
    expect(steps.every(s => s.done)).toBeTrue();
  });

  it('keeps the escalation time the Core sends instead of dropping it', () => {
    const dto = { ...DETAIL_FIXTURE, alert: { ...DETAIL_FIXTURE.alert!, escalatedAt: '2026-10-30T12:30:00Z' } };
    expect(incidentDetailFromDto(dto).alert?.escalatedAt).toBe('2026-10-30T12:30:00Z');
  });
});
