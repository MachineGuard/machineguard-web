import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { MONITORING_REPOSITORY } from '../../domain/repositories/monitoring.repository';
import { toMonitoringZoneViewModel } from './zone.mapper';

@Injectable({ providedIn: 'root' })
export class EnvironmentalMonitoringService {
  private readonly repository = inject(MONITORING_REPOSITORY);
  readonly zones$ = this.repository
    .watchSnapshot()
    .pipe(
      map((snapshot) =>
        snapshot.zones.map((zone) => toMonitoringZoneViewModel(zone, snapshot)),
      ),
    );
}
