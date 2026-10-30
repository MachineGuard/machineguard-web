import { inject, Injectable } from '@angular/core';
import { ALERT_REPOSITORY } from '../../domain/repositories/alert.repository';
import { shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly repository = inject(ALERT_REPOSITORY);
  readonly latestAlerts$ = this.repository.watchLatest().pipe(shareReplay({ bufferSize: 1, refCount: true }));
  acknowledge(alertId: string) {
    return this.repository.acknowledge(alertId);
  }
}
