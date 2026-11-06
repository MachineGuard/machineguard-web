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
  STALE: {label:'status.STALE',className:'offline'},
  NO_DATA: {label:'status.NO_DATA',className:'offline'},
  UNKNOWN: {label:'status.UNKNOWN',className:'offline'},
  OFFLINE: { label: 'status.OFFLINE', className: 'offline' },
};
