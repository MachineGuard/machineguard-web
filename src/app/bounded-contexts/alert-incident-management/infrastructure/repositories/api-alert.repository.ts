import { inject, Injectable } from '@angular/core';
import { AlertFilters, AlertRepository } from '../../domain/repositories/alert.repository';
import { AlertsApiClient } from '../api/alerts-api.client';
import { catchError, defer, EMPTY, map, merge, Subject, switchMap, tap, throwError, timer } from 'rxjs';
import { acknowledgementFromDto, alertFromDto } from '../mappers/alert-incident.mapper';

@Injectable()
export class ApiAlertRepository implements AlertRepository {
  private readonly client = inject(AlertsApiClient);
  private readonly refresh = new Subject<void>();
  list(filters: AlertFilters) { return this.client.list(filters).pipe(map(items => items.map(alertFromDto))); }
  watchLatest() {
    return defer(() => {
      let loaded = false;
      return merge(timer(0, 15_000), this.refresh).pipe(switchMap(() => this.client.getLatest().pipe(
        map(items => items.map(alertFromDto)), tap(() => { loaded = true; }),
        catchError(error => loaded ? EMPTY : throwError(() => error)),
      )));
    });
  }
  acknowledge(id: string) {
    return this.client.acknowledge(id).pipe(map(acknowledgementFromDto), tap(() => this.refresh.next()));
  }
}
