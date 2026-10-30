import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Acknowledgement, Alert, AlertStatus } from '../models/alert.models';

export interface AlertFilters { monitoringZoneId?: string; status?: AlertStatus; }

export interface AlertRepository {
  list(filters: AlertFilters): Observable<Alert[]>;
  watchLatest(): Observable<Alert[]>;
  acknowledge(alertId: string): Observable<Acknowledgement>;
}
export const ALERT_REPOSITORY = new InjectionToken<AlertRepository>(
  'ALERT_REPOSITORY',
);
