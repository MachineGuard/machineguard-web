import { inject, Injectable } from '@angular/core';
import { catchError, concat, EMPTY, map, switchMap, timer } from 'rxjs';
import { MonitoringRepository } from '../../domain/repositories/monitoring.repository';
import { MonitoringApiClient } from '../api/monitoring-api.client';
import { zonesToMonitoringSnapshot } from '../mappers/monitoring-zone.mapper';

export const SNAPSHOT_REFRESH_MS = 15_000;

@Injectable()
export class ApiMonitoringRepository implements MonitoringRepository {
  private readonly client = inject(MonitoringApiClient);

  /** Loads once and then polls. A failed refresh keeps the last snapshot; only the first load can fail. */
  watchSnapshot() {
    const load = () => this.client.getZones().pipe(map(zonesToMonitoringSnapshot));
    return concat(
      load(),
      timer(SNAPSHOT_REFRESH_MS, SNAPSHOT_REFRESH_MS).pipe(switchMap(() => load().pipe(catchError(() => EMPTY)))),
    );
  }
}
