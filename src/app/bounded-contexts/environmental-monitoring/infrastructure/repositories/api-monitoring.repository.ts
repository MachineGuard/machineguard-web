import { inject, Injectable } from '@angular/core';
import { MonitoringRepository } from '../../domain/repositories/monitoring.repository';
import { MonitoringApiClient } from '../api/monitoring-api.client';

@Injectable()
export class ApiMonitoringRepository implements MonitoringRepository {
  private readonly client = inject(MonitoringApiClient);
  watchSnapshot() {
    return this.client.getSnapshot();
  }
}
