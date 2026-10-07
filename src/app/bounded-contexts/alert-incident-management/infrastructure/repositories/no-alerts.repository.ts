import { Injectable } from '@angular/core';
import { EMPTY, of } from 'rxjs';
import { AlertRepository } from '../../domain/repositories/alert.repository';

/** Used against the Core API until Alert & Incident Management exists there: no alerts are invented. */
@Injectable()
export class NoAlertsRepository implements AlertRepository {
  watchLatest() {
    return of([]);
  }

  acknowledge() {
    return EMPTY;
  }
}
