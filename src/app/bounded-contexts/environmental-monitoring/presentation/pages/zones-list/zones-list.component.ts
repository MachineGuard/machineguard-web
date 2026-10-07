import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SessionService } from '../../../../iam/application/services/session.service';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { StatusBadgeComponent, StatusTone } from '../../../../../shared/components/status-badge/status-badge.component';
import { LoadState, loadInto } from '../../../../../shared/format/load-state';
import { saveErrorMessage, VARIABLES } from '../../../../../shared/format/presentation';
import { MonitoringApiClient } from '../../../infrastructure/api/monitoring-api.client';
import { EnvironmentalVariableDto, MonitoringZoneDto } from '../../../infrastructure/api/monitoring-zone.dto';

interface ZoneRow {
  zone: MonitoringZoneDto;
  setup: { label: string; tone: StatusTone };
  ranges: string;
  ready: boolean;
}

@Component({
  selector: 'app-zones-list',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent, ModalComponent, StatusBadgeComponent],
  templateUrl: './zones-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZonesListComponent {
  private readonly api = inject(MonitoringApiClient);
  private readonly router = inject(Router);
  private readonly session = inject(SessionService).session;

  readonly state = signal<LoadState<MonitoringZoneDto[]>>({ status: 'loading' });
  readonly canEdit = computed(() => this.session()?.user.role === 'ADMIN');
  readonly rows = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.data.map(toRow) : [];
  });
  readonly readyCount = computed(() => this.rows().filter((row) => row.ready).length);

  readonly creating = signal(false);
  readonly saving = signal(false);
  readonly submitted = signal(false);
  readonly formError = signal<string | null>(null);
  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(150)]],
    description: ['', Validators.maxLength(500)],
  });

  constructor() {
    this.load();
  }

  load(): void {
    loadInto(this.state, this.api.getZones());
  }

  openForm(): void {
    this.form.reset();
    this.submitted.set(false);
    this.formError.set(null);
    this.creating.set(true);
  }

  create(): void {
    this.submitted.set(true);
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const { name, description } = this.form.getRawValue();
    this.api.registerZone({ name: name.trim(), description: description.trim() || null }).subscribe({
      next: (zone) => void this.router.navigate(['/zones', zone.id]),
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(saveErrorMessage(error, 'Ya existe una zona con esos datos.'));
      },
    });
  }
}

function toRow(zone: MonitoringZoneDto): ZoneRow {
  const range = (variable: EnvironmentalVariableDto) => {
    const threshold = zone.thresholds.find((t) => t.environmentalVariable === variable);
    return threshold ? `${threshold.minimumValue}–${threshold.maximumValue} ${VARIABLES[variable].unit}` : '—';
  };
  const hasPoints = zone.points.length > 0;
  const missing = (['TEMPERATURE', 'HUMIDITY'] as const).filter(
    (variable) => !zone.thresholds.some((t) => t.environmentalVariable === variable),
  );
  let setup: ZoneRow['setup'] = { label: 'Completa', tone: 'normal' };
  if (!hasPoints && missing.length === 2) setup = { label: 'Sin puntos ni rangos', tone: 'offline' };
  else if (!hasPoints) setup = { label: 'Falta un punto de monitoreo', tone: 'near-limit' };
  else if (missing.length === 2) setup = { label: 'Faltan los rangos seguros', tone: 'near-limit' };
  else if (missing.length === 1)
    setup = { label: `Falta rango de ${missing[0] === 'HUMIDITY' ? 'humedad' : 'temperatura'}`, tone: 'near-limit' };
  return { zone, setup, ranges: `${range('TEMPERATURE')} / ${range('HUMIDITY')}`, ready: hasPoints && missing.length < 2 };
}
