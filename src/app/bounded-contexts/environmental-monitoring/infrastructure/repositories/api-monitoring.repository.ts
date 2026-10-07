import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { MonitoringRepository } from '../../domain/repositories/monitoring.repository';
import { MonitoringApiClient } from '../api/monitoring-api.client';
import { zonesToMonitoringSnapshot } from '../mappers/monitoring-zone.mapper';

@Injectable()
export class ApiMonitoringRepository implements MonitoringRepository {
  private readonly client = inject(MonitoringApiClient);
  watchSnapshot() {
    return this.client.getZones().pipe(map(zonesToMonitoringSnapshot));
  }
}
