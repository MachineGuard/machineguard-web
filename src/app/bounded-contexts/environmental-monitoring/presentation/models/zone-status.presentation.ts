import { ZoneStatus } from '../../domain/models/monitoring.models';
import { StatusTone } from '../../../../shared/components/status-badge/status-badge.component';

export const STATUS_META: Record<
  ZoneStatus,
  { label: string; className: StatusTone }
> = {
  NORMAL: { label: 'Normal', className: 'normal' },
  NEAR_LIMIT: { label: 'Near limit', className: 'near-limit' },
  OUT_OF_RANGE: { label: 'Out of range', className: 'out-of-range' },
  OFFLINE: { label: 'Offline', className: 'offline' },
};
