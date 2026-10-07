import { inject, Injectable } from '@angular/core';
import { catchError, defer, map, of, shareReplay, startWith } from 'rxjs';
import { MONITORING_REPOSITORY } from '../../domain/repositories/monitoring.repository';
import { MonitoringLoadState } from '../models/monitoring-load-state';
import { toMonitoringZoneViewModel } from './zone.mapper';

@Injectable({ providedIn: 'root' })
export class EnvironmentalMonitoringService {
  private readonly repository = inject(MONITORING_REPOSITORY);
  readonly state$ = defer(() => this.repository.watchSnapshot()).pipe(
    map((snapshot): MonitoringLoadState => {
      const zones = snapshot.zones.map(zone => toMonitoringZoneViewModel(zone, snapshot));
      return { status: zones.length ? 'loaded' : 'empty', zones };
    }),
    catchError((error: unknown) => of<MonitoringLoadState>({ status: 'error', zones: [], error })),
    startWith<MonitoringLoadState>({ status: 'loading', zones: [] }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  // Sidebar can consume counts without an unhandled RxJS error. The facade exposes errors to the dashboard.
  readonly zones$ = this.state$.pipe(map(state => state.zones));
}
