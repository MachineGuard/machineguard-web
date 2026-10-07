import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../../core/http/api-client';
import { MonitoringZoneDto } from './monitoring-zone.dto';

@Injectable({ providedIn: 'root' })
export class MonitoringApiClient {
  private readonly api = inject(ApiClient);
  getZones(): Observable<MonitoringZoneDto[]> {
    return this.api.get<MonitoringZoneDto[]>('environmental-monitoring/zones');
  }
}
