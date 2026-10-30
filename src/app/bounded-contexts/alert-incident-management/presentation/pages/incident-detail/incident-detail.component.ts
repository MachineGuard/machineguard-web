import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, finalize, Observable, of, switchMap, timer } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { I18nService } from '../../../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../../../core/i18n/translate.pipe';
import { StatusBadgeComponent } from '../../../../../shared/components/status-badge/status-badge.component';
import { EnvironmentalMonitoringService } from '../../../../environmental-monitoring/application/services/environmental-monitoring.service';
import { SessionService } from '../../../../iam/application/services/session.service';
import { IncidentService } from '../../../application/services/incident.service';
import { IncidentDetail } from '../../../domain/models/alert.models';
import { incidentTone } from '../../incident.presentation';

@Component({
  selector: 'app-incident-detail', standalone: true,
  imports: [RouterLink, FormsModule, TranslatePipe, StatusBadgeComponent],
  templateUrl: './incident-detail.component.html', styleUrl: './incident-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentDetailComponent {
  private readonly incidents = inject(IncidentService);
  private readonly session = inject(SessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly i18n = inject(I18nService);
  readonly mock = environment.monitoringSource === 'mock';
  readonly detail = signal<IncidentDetail | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly busy = signal(false);
  readonly feedback = signal('');
  readonly actionError = signal('');
  readonly canManage = computed(() => !this.mock && this.session.session()?.user.role === 'ADMIN');
  readonly active = computed(() => !!this.detail() && this.detail()!.incident.status !== 'RESOLVED');
  readonly canAcknowledge = computed(() => this.canManage() && this.active()
    && ['PENDING', 'ESCALATED'].includes(this.detail()?.alert?.status ?? ''));
  readonly zones = toSignal(inject(EnvironmentalMonitoringService).zones$, { initialValue: [] });
  readonly zoneName = computed(() => this.zones().find(z => z.id === this.detail()?.incident.monitoringZoneId)?.name
    ?? this.detail()?.incident.monitoringZoneId ?? '');
  readonly resolutionHint = computed(() => !this.active() ? 'incident.closedHelp' : !this.canManage() ? 'incident.viewer'
    : !this.detail()?.correctiveActions.length ? 'incident.needsAction'
    : !this.detail()?.withinSafeRange ? 'incident.needsRecovery' : 'incident.ready');
  readonly tone = incidentTone;
  private readonly reload = new BehaviorSubject<void>(undefined);
  description = '';
  actionNotes = '';
  resolutionNotes = '';

  constructor() {
    this.route.paramMap.pipe(switchMap(params => {
      const id = params.get('incidentId')!;
      this.detail.set(null); this.loading.set(true);
      return this.reload.pipe(switchMap(() => timer(0, 15_000).pipe(switchMap(() => this.mock ? of(null)
        : this.incidents.detail(id).pipe(catchError((error: unknown) => {
          this.loadError.set(error instanceof HttpErrorResponse && error.status === 404 ? 'incident.notFound' : 'operations.loadError');
          return of(null);
        }))))));
    }), takeUntilDestroyed()).subscribe(detail => {
      if (detail) { this.detail.set(detail); this.loadError.set(''); }
      this.loading.set(false);
    });
  }
  refresh(): void { this.reload.next(); }
  acknowledge(): void {
    const alertId = this.detail()?.alert?.id;
    if (alertId && this.canAcknowledge() && !this.loadError()) this.mutate(this.incidents.acknowledge(alertId), 'incident.ackOk');
  }
  registerAction(): void {
    if (!this.canManage() || !this.active() || this.busy() || this.loadError()) return;
    if (!this.description.trim()) { this.actionError.set('incident.descriptionRequired'); return; }
    this.mutate(this.incidents.registerAction(this.detail()!.incident.id, this.description.trim(), this.actionNotes.trim() || undefined),
      'incident.actionOk', () => { this.description = ''; this.actionNotes = ''; });
  }
  resolve(): void {
    if (!this.canManage() || !this.detail()?.resolutionAllowed || this.busy() || this.loadError()) return;
    this.mutate(this.incidents.resolve(this.detail()!.incident.id, this.resolutionNotes.trim() || undefined),
      'incident.resolveOk', () => { this.resolutionNotes = ''; });
  }
  private mutate(request: Observable<unknown>, success: string, confirmed?: () => void): void {
    if (this.busy()) return;
    this.busy.set(true); this.actionError.set(''); this.feedback.set('');
    request.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.busy.set(false))).subscribe({
      next: () => { confirmed?.(); this.feedback.set(success); this.refresh(); },
      error: (error: unknown) => {
        this.actionError.set(error instanceof HttpErrorResponse && error.status === 409 ? 'incident.conflict'
          : error instanceof HttpErrorResponse && error.status === 403 ? 'incident.forbidden' : 'incident.actionFailed');
        this.refresh();
      },
    });
  }
}
