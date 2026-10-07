import { MonitoringZoneViewModel } from '../../bounded-contexts/environmental-monitoring/application/models/monitoring-zone.view-model';
import { inject, Injectable } from '@angular/core';
import { combineLatest, map, shareReplay, timer } from 'rxjs';
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
    this.monitoring.zones$,
    this.alerts.latestAlerts$,
    timer(0, 1000),
  ]).pipe(
    map(
      ([zones, alerts]): DashboardViewModel => ({
        zones: zones.map((zone) => ({
          ...zone,
          acknowledgementAlertId: alerts.find(
            (alert) =>
              alert.monitoringZoneId === zone.id &&
              alert.severity === 'CRITICAL' &&
              ['PENDING', 'ESCALATED'].includes(alert.status),
          )?.id,
        })),
        alerts,
        updatedSeconds: elapsedSeconds(zones),
        summary: ZONE_STATUSES.map((status) => ({
          status,
          count: zones.filter((z) => z.status === status).length,
        })),
      }),
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
