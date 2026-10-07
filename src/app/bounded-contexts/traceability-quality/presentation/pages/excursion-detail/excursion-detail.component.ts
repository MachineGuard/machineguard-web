import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { MonitoringApiClient } from '../../../../environmental-monitoring/infrastructure/api/monitoring-api.client';
import { MonitoringZoneDto } from '../../../../environmental-monitoring/infrastructure/api/monitoring-zone.dto';
import { SessionService } from '../../../../iam/application/services/session.service';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { StatusBadgeComponent } from '../../../../../shared/components/status-badge/status-badge.component';
import { LoadState, loadInto } from '../../../../../shared/format/load-state';
import { formatDateTime, formatDuration, formatTime, formatValue, saveErrorMessage, VARIABLES } from '../../../../../shared/format/presentation';
import { ExcursionDetailDto, ExcursionsApiClient, MeasurementHistoryDto } from '../../../infrastructure/api/excursions-api.client';
import { EXCURSION_STATUS, SEVERITY_LABELS } from '../../excursion.presentation';

interface Loaded {
  detail: ExcursionDetailDto;
  /** null when the measurement source did not answer; the excursion itself is still shown. */
  history: MeasurementHistoryDto | null;
  zones: MonitoringZoneDto[];
}

@Component({
  selector: 'app-excursion-detail',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent, ModalComponent, StatusBadgeComponent],
  templateUrl: './excursion-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExcursionDetailComponent {
  private readonly api = inject(ExcursionsApiClient);
  private readonly monitoring = inject(MonitoringApiClient);
  private readonly excursionId = inject(ActivatedRoute).snapshot.paramMap.get('excursionId') ?? '';
  private readonly session = inject(SessionService).session;

  readonly state = signal<LoadState<Loaded>>({ status: 'loading' });
  readonly canEdit = computed(() => this.session()?.user.role === 'ADMIN');
  readonly view = computed(() => {
    const state = this.state();
    if (state.status !== 'ready') return null;
    const { detail, history, zones } = state.data;
    const excursion = detail.excursion;
    const variable = VARIABLES[excursion.environmentalVariable];
    const zone = zones.find((z) => z.id === excursion.monitoringZoneId);
    const range = zone?.thresholds.find((t) => t.environmentalVariable === excursion.environmentalVariable);
    const above = excursion.peakValue >= excursion.thresholdValue;
    const pointName = (id: string) => zone?.points.find((p) => p.id === id)?.name ?? '—';
    // Without the zone's current range, the breached limit still tells which side is out.
    const isOut = (value: number) =>
      range ? value < range.minimumValue || value > range.maximumValue
        : above ? value > excursion.thresholdValue : value < excursion.thresholdValue;
    const scale = Math.max(Math.abs(excursion.peakValue), Math.abs(excursion.thresholdValue)) || 1;
    return {
      title: `Excursión de ${variable.label.toLowerCase()}`,
      status: EXCURSION_STATUS[excursion.status],
      context: `${zone?.name ?? 'Zona eliminada'} · ${pointName(excursion.monitoringPointId)} · ${formatDateTime(excursion.startedAt)}`,
      peak: `${formatValue(excursion.peakValue)} ${variable.unit}`,
      limit: `${formatValue(excursion.thresholdValue)} ${variable.unit}`,
      limitLabel: above ? 'Límite superior superado' : 'Límite inferior superado',
      duration: formatDuration(excursion.durationSeconds),
      severity: SEVERITY_LABELS[excursion.severity],
      range: range ? `${formatValue(range.minimumValue)} – ${formatValue(range.maximumValue)} ${variable.unit}` : null,
      correctiveAction: excursion.correctiveAction,
      hasIncident: excursion.incidentId !== null,
      ongoing: excursion.status === 'ONGOING',
      historyUnavailable: history === null,
      measurements: (history?.measurements ?? [])
        .filter((m) => m.environmentalVariable === excursion.environmentalVariable)
        .map((m) => ({
          time: formatTime(m.recordedAt),
          point: pointName(m.monitoringPointId),
          value: `${formatValue(m.value)} ${variable.unit}`,
          out: isOut(m.value),
          width: Math.min(100, Math.max(4, (Math.abs(m.value) / scale) * 100)),
        })),
      nonConformities: detail.nonConformities.map((item) => ({
        ...item,
        registeredAt: formatDateTime(item.registeredAt),
      })),
    };
  });

  readonly registering = signal(false);
  readonly saving = signal(false);
  readonly submitted = signal(false);
  readonly formError = signal<string | null>(null);
  readonly form = inject(FormBuilder).nonNullable.group({
    batchCode: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(60)]],
    productName: ['', Validators.maxLength(150)],
    classification: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(60)]],
  });

  constructor() {
    this.load();
  }

  load(): void {
    loadInto(
      this.state,
      forkJoin({
        detail: this.api.getExcursion(this.excursionId),
        history: this.api.getMeasurementHistory(this.excursionId).pipe(catchError(() => of(null))),
        zones: this.monitoring.getZones(),
      }),
    );
  }

  openForm(): void {
    this.form.reset();
    this.submitted.set(false);
    this.formError.set(null);
    this.registering.set(true);
  }

  register(): void {
    this.submitted.set(true);
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const { batchCode, productName, classification } = this.form.getRawValue();
    this.api
      .registerNonConformity(this.excursionId, {
        batchCode: batchCode.trim(),
        productName: productName.trim() || null,
        classification: classification.trim(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.registering.set(false);
          this.load();
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.formError.set(saveErrorMessage(error, 'Ese lote ya está registrado en esta excursión.'));
        },
      });
  }
}
