import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { TranslatePipe } from '../../../../../core/i18n/translate.pipe';
import { SessionService } from '../../../../iam/application/services/session.service';
import { MonitoringApiClient } from '../../../../environmental-monitoring/infrastructure/api/monitoring-api.client';
import { MonitoringZoneDto } from '../../../../environmental-monitoring/infrastructure/api/monitoring-zone.dto';
import { ReportDto, TraceabilityApiClient } from '../../../infrastructure/api/traceability-api.client';
import { traceabilityError, utcPeriod } from '../../traceability.presentation';

@Component({ selector: 'app-sealed-reports', imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './sealed-reports.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class SealedReportsComponent {
  private readonly api = inject(TraceabilityApiClient);
  private readonly monitoring = inject(MonitoringApiClient);
  private readonly session = inject(SessionService);
  private readonly destroyRef = inject(DestroyRef);
  private query?: Subscription;
  readonly mock = environment.monitoringSource === 'mock';
  readonly canGenerate = computed(() => !this.mock && this.session.session()?.user.role === 'ADMIN');
  readonly zones = signal<MonitoringZoneDto[]>([]);
  readonly reports = signal<ReportDto[]>([]);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly zonesError = signal('');
  readonly commandError = signal('');
  readonly generated = signal<ReportDto | null>(null);
  readonly uncertain = signal(false);
  filter = ''; zone = ''; from = ''; to = ''; confirmed = false;
  constructor() { if (!this.mock) { this.loadZones(); this.load(); } }
  loadZones(): void {
    this.zonesError.set('');
    this.monitoring.getZones().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: zones => this.zones.set(zones), error: e => this.zonesError.set(traceabilityError(e)),
    });
  }
  zoneName(id: string): string { return this.zones().find(z => z.id === id)?.name ?? id; }
  load(): void {
    if (this.mock) return;
    this.query?.unsubscribe(); this.loading.set(true); this.error.set(''); this.reports.set([]);
    this.query = this.api.reports(this.filter || undefined).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: rows => { this.reports.set(rows); this.loading.set(false); },
      error: e => { this.error.set(traceabilityError(e)); this.loading.set(false); },
    });
  }
  generate(): void {
    if (!this.canGenerate() || this.busy()) return;
    this.commandError.set(''); this.generated.set(null); this.uncertain.set(false);
    const period = utcPeriod(this.from, this.to);
    if (!period || !this.zone) { this.commandError.set('trace.periodInvalid'); return; }
    if (!this.confirmed) { this.commandError.set('trace.confirmRequired'); return; }
    this.busy.set(true);
    this.api.generate({ monitoringZoneId: this.zone, periodStart: period.from, periodEnd: period.to })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.busy.set(false))).subscribe({
        next: report => { this.generated.set(report); this.confirmed = false; this.load(); },
        error: e => {
          this.commandError.set(traceabilityError(e)); this.confirmed = false;
          this.uncertain.set(!e.status || e.status >= 500);
        },
      });
  }
}
