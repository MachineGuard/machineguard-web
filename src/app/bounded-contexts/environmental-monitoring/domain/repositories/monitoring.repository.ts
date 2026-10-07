import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { MonitoringSnapshot } from '../models/monitoring.models';

export interface MonitoringRepository {
  watchSnapshot(): Observable<MonitoringSnapshot>;
}
export const MONITORING_REPOSITORY = new InjectionToken<MonitoringRepository>(
  'MONITORING_REPOSITORY',
);
