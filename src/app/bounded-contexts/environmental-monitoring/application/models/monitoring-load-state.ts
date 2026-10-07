import { MonitoringZoneViewModel } from './monitoring-zone.view-model';

export type MonitoringLoadState =
  | { status: 'loading'; zones: MonitoringZoneViewModel[] }
  | { status: 'error'; zones: MonitoringZoneViewModel[]; error: unknown }
  | { status: 'empty' | 'loaded'; zones: MonitoringZoneViewModel[] };
