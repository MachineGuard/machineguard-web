import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { TranslatePipe } from '../../../../../core/i18n/translate.pipe';
import { EnvironmentalVariable, UNITS } from '../../../../../shared/format/presentation';
import { MonitoringApiClient } from '../../../../environmental-monitoring/infrastructure/api/monitoring-api.client';
import { MonitoringZoneDto } from '../../../../environmental-monitoring/infrastructure/api/monitoring-zone.dto';
import { HistoryDto, TraceabilityApiClient } from '../../../infrastructure/api/traceability-api.client';
import { traceabilityError, utcPeriod } from '../../traceability.presentation';

@Component({ selector: 'app-measurement-history', imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './measurement-history.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class MeasurementHistoryComponent {
  private readonly api = inject(TraceabilityApiClient);
  private readonly monitoring = inject(MonitoringApiClient);
  private readonly destroyRef = inject(DestroyRef);
  private query?: Subscription;
  readonly mock = environment.monitoringSource === 'mock';
  readonly zones = signal<MonitoringZoneDto[]>([]);
  readonly data = signal<HistoryDto | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly zonesError = signal('');
  readonly units = UNITS;
  zone = ''; from = ''; to = ''; variable: EnvironmentalVariable | '' = '';
  constructor() { if (!this.mock) this.loadZones(); }
  loadZones(): void {
    this.zonesError.set('');
    this.monitoring.getZones().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: zones => this.zones.set(zones), error: e => this.zonesError.set(traceabilityError(e)),
    });
  }
  pointName(id: string): string {
    return this.zones().flatMap(z => z.points).find(p => p.id === id)?.name ?? id;
  }
  search(): void {
    if (this.mock) return;
    this.query?.unsubscribe(); this.data.set(null); this.error.set(''); this.loading.set(false);
    const period = utcPeriod(this.from, this.to);
    if (!period || !this.zone) { this.error.set('trace.periodInvalid'); return; }
    this.loading.set(true);
    this.query = this.api.history({ monitoringZoneId: this.zone, ...period, variable: this.variable || undefined })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: data => { this.data.set(data); this.loading.set(false); },
        error: e => { this.error.set(traceabilityError(e)); this.loading.set(false); },
      });
  }
}
