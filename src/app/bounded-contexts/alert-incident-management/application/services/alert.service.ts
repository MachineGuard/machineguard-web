import { inject, Injectable } from '@angular/core';
import { ALERT_REPOSITORY, AlertFilters } from '../../domain/repositories/alert.repository';
import { shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly repository = inject(ALERT_REPOSITORY);
  readonly latestAlerts$ = this.repository.watchLatest().pipe(shareReplay({ bufferSize: 1, refCount: true }));
  list(filters: AlertFilters) { return this.repository.list(filters); }
  acknowledge(alertId: string) {
    return this.repository.acknowledge(alertId);
  }
}
