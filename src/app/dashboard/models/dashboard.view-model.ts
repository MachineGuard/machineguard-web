import { MonitoringZoneViewModel } from '../../bounded-contexts/environmental-monitoring/application/models/monitoring-zone.view-model';
import { ZoneStatus } from '../../bounded-contexts/environmental-monitoring/domain/models/monitoring.models';
import { Alert } from '../../bounded-contexts/alert-incident-management/domain/models/alert.models';

export interface StatusSummaryItem {
  status: ZoneStatus;
  count: number;
}
export interface DashboardViewModel {
  zones: DashboardZoneViewModel[];
  alerts: Alert[];
  summary: StatusSummaryItem[];
  updatedSeconds: number | null;
}
export interface DashboardZoneViewModel extends MonitoringZoneViewModel {
  acknowledgementAlertId?: string;
}
export const ZONE_STATUSES: ZoneStatus[] = [
  'NORMAL',
  'NEAR_LIMIT',
  'OUT_OF_RANGE',
  'OFFLINE',
];
