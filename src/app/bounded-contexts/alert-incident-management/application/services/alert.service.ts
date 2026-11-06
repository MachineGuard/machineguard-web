import { inject, Injectable } from '@angular/core';
import { ALERT_REPOSITORY, AlertFilters } from '../../domain/repositories/alert.repository';
import { map,shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly repository = inject(ALERT_REPOSITORY);
  readonly latestState$=(this.repository.watchLatestState?.() ?? this.repository.watchLatest().pipe(
    map(alerts=>({alerts,refreshFailed:false})))).pipe(shareReplay({bufferSize:1,refCount:true}));
  readonly latestAlerts$=this.latestState$.pipe(map(state=>state.alerts));
  list(filters: AlertFilters) { return this.repository.list(filters); }
  acknowledge(alertId: string) {
    return this.repository.acknowledge(alertId);
  }
}
