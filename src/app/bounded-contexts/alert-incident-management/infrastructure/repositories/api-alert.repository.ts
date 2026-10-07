import { inject, Injectable } from '@angular/core';
import { AlertRepository } from '../../domain/repositories/alert.repository';
import { AlertsApiClient } from '../api/alerts-api.client';

@Injectable()
export class ApiAlertRepository implements AlertRepository {
  private readonly client = inject(AlertsApiClient);
  watchLatest() {
    return this.client.getLatest();
  }
  acknowledge(id: string) {
    return this.client.acknowledge(id);
  }
}
