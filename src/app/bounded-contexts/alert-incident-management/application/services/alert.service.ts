import { inject, Injectable } from '@angular/core';
import { ALERT_REPOSITORY } from '../../domain/repositories/alert.repository';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly repository = inject(ALERT_REPOSITORY);
  readonly latestAlerts$ = this.repository.watchLatest();
  acknowledge(alertId: string) {
    return this.repository.acknowledge(alertId);
  }
}
