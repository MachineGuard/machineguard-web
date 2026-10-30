import { inject, Injectable } from '@angular/core';
import { Subject, tap } from 'rxjs';
import { INCIDENT_REPOSITORY, IncidentFilters } from '../../domain/repositories/incident.repository';
import { AlertService } from './alert.service';

@Injectable({ providedIn: 'root' })
export class IncidentService {
  private readonly repository = inject(INCIDENT_REPOSITORY);
  private readonly alerts = inject(AlertService);
  private readonly changed = new Subject<void>();
  readonly changes$ = this.changed.asObservable();
  list(filters: IncidentFilters) { return this.repository.list(filters); }
  detail(id: string) { return this.repository.detail(id); }
  acknowledge(alertId: string) { return this.alerts.acknowledge(alertId).pipe(tap(() => this.changed.next())); }
  registerAction(id: string, description: string, notes?: string) {
    return this.repository.registerAction(id, description, notes).pipe(tap(() => this.changed.next()));
  }
  resolve(id: string, notes?: string) {
    return this.repository.resolve(id, notes).pipe(tap(() => this.changed.next()));
  }
}
