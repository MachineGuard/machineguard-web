import { inject, Injectable } from '@angular/core';
import { AlertFilters, AlertRepository } from '../../domain/repositories/alert.repository';
import { AlertsApiClient } from '../api/alerts-api.client';
import { catchError, defer, of, map, merge, Subject, switchMap, tap, timer, filter } from 'rxjs';
import { acknowledgementFromDto, alertFromDto } from '../mappers/alert-incident.mapper';

@Injectable()
export class ApiAlertRepository implements AlertRepository {
  private readonly client = inject(AlertsApiClient);
  private readonly refresh = new Subject<void>();
  list(filters: AlertFilters) { return this.client.list(filters).pipe(map(items => items.map(alertFromDto))); }
  watchLatest() { return this.watchLatestState().pipe(filter(state=>!state.refreshFailed),map(state=>state.alerts)); }
  watchLatestState() {
    return defer(() => {
      let alerts: ReturnType<typeof alertFromDto>[]=[];
      return merge(of(0),timer(15_000,15_000),this.refresh).pipe(switchMap(() => this.client.getLatest().pipe(
        map(items=>{alerts=items.map(alertFromDto);return {alerts,refreshFailed:false};}),
        catchError(()=>of({alerts,refreshFailed:true})),
      )));
    });
  }
  acknowledge(id: string) {
    return this.client.acknowledge(id).pipe(map(acknowledgementFromDto), tap(() => this.refresh.next()));
  }
}
