import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { I18nService } from '../../../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../../../core/i18n/translate.pipe';
import { MonitoringApiClient } from '../../../../environmental-monitoring/infrastructure/api/monitoring-api.client';
import { MonitoringZoneDto } from '../../../../environmental-monitoring/infrastructure/api/monitoring-zone.dto';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../../../shared/components/status-badge/status-badge.component';
import { LoadState, loadInto } from '../../../../../shared/format/load-state';
import { formatDuration, formatValue, UNITS } from '../../../../../shared/format/presentation';
import { ExcursionDto, ExcursionsApiClient, ExcursionStatus } from '../../../infrastructure/api/excursions-api.client';
import { EXCURSION_TONE } from '../../excursion.presentation';

@Component({
  selector: 'app-excursions-list',
  standalone: true,
  imports: [RouterLink, IconComponent, StatusBadgeComponent, TranslatePipe],
  templateUrl: './excursions-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExcursionsListComponent {
  private readonly excursions = inject(ExcursionsApiClient);
  private readonly monitoring = inject(MonitoringApiClient);
  private readonly i18n = inject(I18nService);

  readonly zoneFilter = signal('');
  readonly statusFilter = signal<ExcursionStatus | ''>('');
  readonly state = signal<LoadState<{ excursions: ExcursionDto[]; zones: MonitoringZoneDto[] }>>({ status: 'loading' });
  readonly zones = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.data.zones : [];
  });
  readonly rows = computed(() => {
    const state = this.state();
    if (state.status !== 'ready') return [];
    return state.data.excursions.map((excursion) => {
      const zone = state.data.zones.find((z) => z.id === excursion.monitoringZoneId);
      const unit = UNITS[excursion.environmentalVariable];
      return {
        id: excursion.id,
        ongoing: excursion.status === 'ONGOING',
        zone: zone?.name ?? this.i18n.t('reports.deletedZone'),
        point: zone?.points.find((p) => p.id === excursion.monitoringPointId)?.name ?? '—',
        variable: this.i18n.t(`variable.short.${excursion.environmentalVariable}`),
        startedAt: this.i18n.dateTime(excursion.startedAt),
        duration: formatDuration(excursion.durationSeconds),
        peak: `${formatValue(excursion.peakValue)} ${unit}`,
        limit: `${formatValue(excursion.thresholdValue)} ${unit}`,
        severity: this.i18n.t(`excursion.severity.${excursion.severity}`),
        status: { label: this.i18n.t(`excursion.status.${excursion.status}`), tone: EXCURSION_TONE[excursion.status] },
      };
    });
  });
  readonly ongoing = computed(() => this.rows().filter((row) => row.ongoing));
  readonly filtered = computed(() => this.zoneFilter() !== '' || this.statusFilter() !== '');

  constructor() {
    this.load();
  }

  load(): void {
    loadInto(
      this.state,
      forkJoin({
        excursions: this.excursions.getExcursions({
          monitoringZoneId: this.zoneFilter() || undefined,
          status: this.statusFilter() || undefined,
        }),
        zones: this.monitoring.getZones(),
      }),
    );
  }

  filterByZone(zoneId: string): void {
    this.zoneFilter.set(zoneId);
    this.load();
  }

  filterByStatus(status: string): void {
    this.statusFilter.set(status as ExcursionStatus | '');
    this.load();
  }

  clearFilters(): void {
    this.zoneFilter.set('');
    this.statusFilter.set('');
    this.load();
  }
}
