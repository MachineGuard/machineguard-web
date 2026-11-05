import { inject, Injectable } from '@angular/core';
import { catchError, concat, defer, of, map, switchMap, timer } from 'rxjs';
import { MonitoringRepository } from '../../domain/repositories/monitoring.repository';
import { MonitoringApiClient } from '../api/monitoring-api.client';
import { MonitoringSnapshot } from '../../domain/models/monitoring.models';
import { zonesToMonitoringSnapshot } from '../mappers/monitoring-zone.mapper';

export const SNAPSHOT_REFRESH_MS = 15_000;

@Injectable()
export class ApiMonitoringRepository implements MonitoringRepository {
  private readonly client = inject(MonitoringApiClient);

  /** Failures are snapshots too: preserve data and keep polling after an initial error. */
  watchSnapshot() {
    return defer(() => {
      let last: MonitoringSnapshot = {zones:[],points:[],nodes:[],measurements:[],thresholds:[]};
      return concat(of(0),timer(SNAPSHOT_REFRESH_MS,SNAPSHOT_REFRESH_MS)).pipe(switchMap(() =>
        this.client.getZones().pipe(map(zones => {
          last={...zonesToMonitoringSnapshot(zones),refreshFailed:false};return last;
        }),catchError(() => of({...last,refreshFailed:true})))));
    });
  }
}
