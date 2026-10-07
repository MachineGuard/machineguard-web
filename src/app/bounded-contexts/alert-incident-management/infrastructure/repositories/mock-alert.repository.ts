import { Injectable } from '@angular/core';
import { BehaviorSubject, defer, of, throwError } from 'rxjs';
import { Alert } from '../../domain/models/alert.models';
import { AlertRepository } from '../../domain/repositories/alert.repository';

@Injectable()
export class MockAlertRepository implements AlertRepository {
  private readonly alerts = new BehaviorSubject<Alert[]>([
    {
      id: 'alert-cold-room',
      monitoringZoneId: 'cold-room-a',
      zoneName: 'Cold Room A',
      message: 'Temperature 11.2°C exceeded 8.0°C limit',
      contextNote: 'Critical Excursion Spike',
      severity: 'CRITICAL',
      status: 'PENDING',
      raisedAt: new Date(Date.now() - 8 * 60000).toISOString(),
    },
    {
      id: 'alert-zone-c',
      monitoringZoneId: 'zone-c',
      zoneName: 'Zone C',
      message: 'Relative humidity reached 71%',
      contextNote: 'HVAC Dehumidifier Triggered',
      severity: 'WARNING',
      status: 'PENDING',
      raisedAt: new Date(Date.now() - 37 * 60000).toISOString(),
    },
    {
      id: 'alert-dry-store',
      monitoringZoneId: 'dry-store',
      zoneName: 'Dry Store',
      message: 'Temp stabilized at 24.0°C',
      contextNote: 'Door seal reset verified',
      severity: 'INFO',
      status: 'CLOSED',
      raisedAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
    },
  ]);
  watchLatest() {
    return this.alerts.asObservable();
  }
  acknowledge(alertId: string) {
    return defer(() => {
      const alert = this.alerts.value.find((a) => a.id === alertId);
      if (!alert || !['PENDING', 'ESCALATED'].includes(alert.status)) {
        return throwError(
          () => new Error('This alert cannot be acknowledged.'),
        );
      }
      this.alerts.next(
        this.alerts.value.map((a) =>
          a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a,
        ),
      );
      return of({ alertId, acknowledgedAt: new Date().toISOString() });
    });
  }
}
