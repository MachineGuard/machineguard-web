import { MonitoringZoneViewModel } from '../../bounded-contexts/environmental-monitoring/application/models/monitoring-zone.view-model';
import { inject, Injectable } from '@angular/core';
import { combineLatest, filter, map, shareReplay, timer } from 'rxjs';
import { EnvironmentalMonitoringService } from '../../bounded-contexts/environmental-monitoring/application/services/environmental-monitoring.service';
import { AlertService } from '../../bounded-contexts/alert-incident-management/application/services/alert.service';
import {
  DashboardViewModel,
  ZONE_STATUSES,
} from '../models/dashboard.view-model';

@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private readonly monitoring = inject(EnvironmentalMonitoringService);
  private readonly alerts = inject(AlertService);
  readonly viewModel$ = combineLatest([
    this.monitoring.state$.pipe(
      filter(state => state.status !== 'loading'),
      map(state => state),
    ),
    this.alerts.latestState$,
    timer(0, 1000),
  ]).pipe(
    map(
      ([state, alertState]): DashboardViewModel => {
        const zones=state.zones;const alerts=alertState.alerts;
        return ({
        refreshFailed: state.status==='error' || alertState.refreshFailed,
        zones: zones.map((zone) => ({
          ...zone,
          acknowledgementAlertId: alerts.find(
            (alert) =>
              alert.monitoringZoneId === zone.id &&
              alert.severity === 'CRITICAL' &&
              ['PENDING', 'ESCALATED'].includes(alert.status),
          )?.id,
        })),
        alerts: alerts.filter(alert => zones.some(zone => zone.id === alert.monitoringZoneId))
          .map(alert => ({ ...alert, zoneName: zones.find(zone => zone.id === alert.monitoringZoneId)?.name ?? alert.zoneName })),
        updatedSeconds: elapsedSeconds(zones),
        summary: ZONE_STATUSES.map((status) => ({
          status,
          count: zones.filter((z) => z.status === status || status==='OFFLINE' && ['STALE','NO_DATA','UNKNOWN'].includes(z.status)).length,
        })),
      });},
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  acknowledge(alertId: string) {
    return this.alerts.acknowledge(alertId);
  }
}

function elapsedSeconds(zones: MonitoringZoneViewModel[]): number | null {
  const latest = Math.max(
    0,
    ...zones.map((zone) =>
      zone.lastUpdated ? Date.parse(zone.lastUpdated) : 0,
    ),
  );
  return latest > 0
    ? Math.max(0, Math.floor((Date.now() - latest) / 1000))
    : null;
}
