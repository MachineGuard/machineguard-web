import { StatusTone } from '../../../shared/components/status-badge/status-badge.component';

export function incidentTone(status: string): StatusTone {
  return status === 'RESOLVED' || status === 'CLOSED' ? 'normal'
    : status === 'ACKNOWLEDGED' ? 'near-limit' : 'out-of-range';
}
