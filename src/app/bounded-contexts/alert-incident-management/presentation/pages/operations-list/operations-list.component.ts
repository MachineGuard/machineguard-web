import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, map, Observable, of, switchMap, timer } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { I18nService } from '../../../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../../../core/i18n/translate.pipe';
import { StatusBadgeComponent } from '../../../../../shared/components/status-badge/status-badge.component';
import { EnvironmentalMonitoringService } from '../../../../environmental-monitoring/application/services/environmental-monitoring.service';
import { AlertService } from '../../../application/services/alert.service';
import { IncidentService } from '../../../application/services/incident.service';
import { AlertStatus, IncidentStatus } from '../../../domain/models/alert.models';
import { incidentTone } from '../../incident.presentation';

interface OperationRow { id: string; zoneId: string; status: string; date: string; description: string; incidentId?: string; severity?: string; }

@Component({
  selector: 'app-operations-list', standalone: true,
  imports: [RouterLink, TranslatePipe, StatusBadgeComponent],
  templateUrl: './operations-list.component.html',
  styleUrl: './operations-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationsListComponent {
  private readonly alerts = inject(AlertService);
  private readonly incidents = inject(IncidentService);
  readonly i18n = inject(I18nService);
  readonly isAlerts = inject(ActivatedRoute).snapshot.data['kind'] === 'alerts';
  readonly mock = environment.monitoringSource === 'mock';
  private readonly reload = new BehaviorSubject<void>(undefined);
  private applied = { zone: '', status: '', from: '', to: '' };
  readonly zoneFilter = signal('');
  readonly statusFilter = signal('');
  readonly from = signal('');
  readonly to = signal('');
  readonly rows = signal<OperationRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly invalidPeriod = signal(false);
  readonly zones = toSignal(inject(EnvironmentalMonitoringService).zones$, { initialValue: [] });
  readonly statuses = this.isAlerts ? ['PENDING', 'ACKNOWLEDGED', 'ESCALATED', 'CLOSED'] : ['OPEN', 'ACKNOWLEDGED', 'ESCALATED', 'RESOLVED'];
  readonly filtered = computed(() => !!(this.zoneFilter() || this.statusFilter() || this.from() || this.to()));
  readonly tone = incidentTone;

  constructor() {
    this.reload.pipe(switchMap(() => timer(0, 15_000).pipe(switchMap(() => {
      if (this.mock && !this.isAlerts) { this.loading.set(false); return of([]); }
      const monitoringZoneId = this.applied.zone || undefined;
      const request: Observable<OperationRow[]> = this.isAlerts
        ? this.alerts.list({ monitoringZoneId, status: (this.applied.status || undefined) as AlertStatus | undefined }).pipe(
          map(items => items.map(a => ({ id: a.id, zoneId: a.monitoringZoneId, status: a.status, date: a.raisedAt,
            description: a.message, incidentId: a.incidentId, severity: a.severityLevel ?? a.severity }))))
        : this.incidents.list({ monitoringZoneId, status: (this.applied.status || undefined) as IncidentStatus | undefined,
          from: this.applied.from || undefined, to: this.applied.to || undefined }).pipe(
          map(items => items.map(i => ({ id: i.id, zoneId: i.monitoringZoneId, status: i.status, date: i.openedAt,
            description: i.environmentalVariable ?? 'UNKNOWN', incidentId: i.id }))));
      return request.pipe(map(rows => { this.error.set(false); return rows; }), catchError(() => {
        this.error.set(true); return of(null);
      }));
    }))), takeUntilDestroyed()).subscribe(rows => { if (rows) this.rows.set(rows); this.loading.set(false); });
  }
  zoneName(id: string) { return this.zones().find(z => z.id === id)?.name ?? id; }
  apply(): void {
    if (this.from() && this.to() && this.from() > this.to()) { this.invalidPeriod.set(true); return; }
    this.applied = { zone: this.zoneFilter(), status: this.statusFilter(),
      from: this.from() ? new Date(this.from()).toISOString() : '', to: this.to() ? new Date(this.to()).toISOString() : '' };
    this.invalidPeriod.set(false); this.loading.set(true); this.rows.set([]); this.reload.next();
  }
  clear(): void { this.zoneFilter.set(''); this.statusFilter.set(''); this.from.set(''); this.to.set(''); this.apply(); }
}
