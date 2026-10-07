import { ZoneStatus } from '../../domain/models/monitoring.models';
import { StatusTone } from '../../../../shared/components/status-badge/status-badge.component';

/** `label` is a translation key. */
export const STATUS_META: Record<
  ZoneStatus,
  { label: string; className: StatusTone }
> = {
  NORMAL: { label: 'status.NORMAL', className: 'normal' },
  NEAR_LIMIT: { label: 'status.NEAR_LIMIT', className: 'near-limit' },
  OUT_OF_RANGE: { label: 'status.OUT_OF_RANGE', className: 'out-of-range' },
  OFFLINE: { label: 'status.OFFLINE', className: 'offline' },
};
