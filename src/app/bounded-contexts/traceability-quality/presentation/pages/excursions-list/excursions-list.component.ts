import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MonitoringApiClient } from '../../../../environmental-monitoring/infrastructure/api/monitoring-api.client';
import { MonitoringZoneDto } from '../../../../environmental-monitoring/infrastructure/api/monitoring-zone.dto';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../../../shared/components/status-badge/status-badge.component';
import { LoadState, loadInto } from '../../../../../shared/format/load-state';
import { formatDateTime, formatDuration, formatValue, VARIABLES } from '../../../../../shared/format/presentation';
import { ExcursionDto, ExcursionsApiClient, ExcursionStatus } from '../../../infrastructure/api/excursions-api.client';
import { EXCURSION_STATUS, SEVERITY_LABELS } from '../../excursion.presentation';

@Component({
  selector: 'app-excursions-list',
  standalone: true,
  imports: [RouterLink, IconComponent, StatusBadgeComponent],
  templateUrl: './excursions-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExcursionsListComponent {
  private readonly excursions = inject(ExcursionsApiClient);
  private readonly monitoring = inject(MonitoringApiClient);

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
      const unit = VARIABLES[excursion.environmentalVariable].unit;
      return {
        id: excursion.id,
        ongoing: excursion.status === 'ONGOING',
        zone: zone?.name ?? 'Zona eliminada',
        point: zone?.points.find((p) => p.id === excursion.monitoringPointId)?.name ?? '—',
        variable: VARIABLES[excursion.environmentalVariable].label,
        startedAt: formatDateTime(excursion.startedAt),
        duration: formatDuration(excursion.durationSeconds),
        peak: `${formatValue(excursion.peakValue)} ${unit}`,
        limit: `${formatValue(excursion.thresholdValue)} ${unit}`,
        severity: SEVERITY_LABELS[excursion.severity],
        status: EXCURSION_STATUS[excursion.status],
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
