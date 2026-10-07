import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Acknowledgement, Alert } from '../models/alert.models';

export interface AlertRepository {
  watchLatest(): Observable<Alert[]>;
  acknowledge(alertId: string): Observable<Acknowledgement>;
}
export const ALERT_REPOSITORY = new InjectionToken<AlertRepository>(
  'ALERT_REPOSITORY',
);
