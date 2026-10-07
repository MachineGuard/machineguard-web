import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { I18nService } from '../../../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../../../core/i18n/translate.pipe';
import { SessionService } from '../../../../iam/application/services/session.service';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { StatusBadgeComponent, StatusTone } from '../../../../../shared/components/status-badge/status-badge.component';
import { LoadState, loadInto } from '../../../../../shared/format/load-state';
import { formatValue, saveErrorKey, UNITS } from '../../../../../shared/format/presentation';
import { MonitoringApiClient } from '../../../infrastructure/api/monitoring-api.client';
import { EnvironmentalVariableDto, MonitoringZoneDto } from '../../../infrastructure/api/monitoring-zone.dto';

type Dialog =
  | { kind: 'threshold'; variable: EnvironmentalVariableDto }
  | { kind: 'point' }
  | { kind: 'sensor'; pointId: string; pointName: string };

const DECIMAL = /^-?\d{1,4}([.,]\d{1,2})?$/;
const SENSOR_TONE: Record<string, StatusTone> = { ONLINE: 'normal', OFFLINE: 'offline', INACTIVE: 'offline' };

@Component({
  selector: 'app-zone-detail',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent, ModalComponent, StatusBadgeComponent, TranslatePipe],
  templateUrl: './zone-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneDetailComponent {
  private readonly api = inject(MonitoringApiClient);
  private readonly zoneId = inject(ActivatedRoute).snapshot.paramMap.get('zoneId') ?? '';
  private readonly session = inject(SessionService).session;
  private readonly forms = inject(FormBuilder).nonNullable;
  private readonly i18n = inject(I18nService);

  readonly state = signal<LoadState<MonitoringZoneDto>>({ status: 'loading' });
  readonly canEdit = computed(() => this.session()?.user.role === 'ADMIN');
  readonly zone = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.data : null;
  });
  readonly ranges = computed(() => {
    const zone = this.zone();
    return (['TEMPERATURE', 'HUMIDITY'] as const).map((variable) => {
      const threshold = zone?.thresholds.find((t) => t.environmentalVariable === variable);
      const latest = zone?.latestMeasurements.find((m) => m.environmentalVariable === variable);
      return {
        variable,
        label: this.i18n.t(`variable.${variable}`),
        unit: UNITS[variable],
        range: threshold ? `${formatValue(threshold.minimumValue)} – ${formatValue(threshold.maximumValue)}` : null,
        threshold,
        latest: latest ? `${formatValue(latest.measuredValue)} ${UNITS[variable]}` : null,
      };
    });
  });
  readonly points = computed(() => {
    const zone = this.zone();
    return (zone?.points ?? []).map((point) => {
      const sensor = zone!.sensors.find((s) => s.monitoringPointId === point.id);
      return {
        point,
        sensor,
        status: sensor ? { label: this.i18n.t(`zone.sensor.${sensor.status}`), tone: SENSOR_TONE[sensor.status] } : null,
        lastSeen: this.i18n.elapsed(sensor?.lastMeasurementAt ?? null),
      };
    });
  });

  readonly dialog = signal<Dialog | null>(null);
  readonly saving = signal(false);
  readonly submitted = signal(false);
  readonly formError = signal<string | null>(null);
  readonly saved = signal<string | null>(null);

  readonly thresholdForm = this.forms.group({
    minimum: ['', [Validators.required, Validators.pattern(DECIMAL)]],
    maximum: ['', [Validators.required, Validators.pattern(DECIMAL)]],
  });
  readonly pointForm = this.forms.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(150)]],
    location: ['', Validators.maxLength(250)],
  });
  readonly sensorForm = this.forms.group({
    deviceCode: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    interval: ['60', [Validators.required, Validators.pattern(/^[1-9]\d{0,5}$/)]],
  });

  constructor() {
    this.load();
  }

  load(): void {
    loadInto(this.state, this.api.getZone(this.zoneId));
  }

  open(dialog: Dialog): void {
    this.submitted.set(false);
    this.formError.set(null);
    this.saved.set(null);
    this.pointForm.reset();
    this.sensorForm.reset();
    const current = dialog.kind === 'threshold' && this.zone()?.thresholds.find((t) => t.environmentalVariable === dialog.variable);
    this.thresholdForm.reset(current ? { minimum: String(current.minimumValue), maximum: String(current.maximumValue) } : {});
    this.dialog.set(dialog);
  }

  variableLabel(variable: EnvironmentalVariableDto): string {
    return `${this.i18n.t(`variable.${variable}`)} (${UNITS[variable]})`;
  }

  /** True when both bounds parse but are not an increasing range. */
  rangeInverted(): boolean {
    const { minimum, maximum } = this.thresholdForm.getRawValue();
    return this.thresholdForm.valid && toNumber(minimum) >= toNumber(maximum);
  }

  saveThreshold(variable: EnvironmentalVariableDto): void {
    this.submitted.set(true);
    if (this.thresholdForm.invalid || this.rangeInverted()) return;
    const { minimum, maximum } = this.thresholdForm.getRawValue();
    const range = { minimumValue: toNumber(minimum), maximumValue: toNumber(maximum) };
    this.save(
      this.api.configureThreshold(this.zoneId, variable, range),
      () =>
        this.i18n.t('zone.range.saved', {
          variable: this.i18n.t(`variable.short.${variable}`).toLowerCase(),
          range: `${formatValue(range.minimumValue)} – ${formatValue(range.maximumValue)} ${UNITS[variable]}`,
        }),
      'zone.range.inverted',
    );
  }

  savePoint(): void {
    this.submitted.set(true);
    if (this.pointForm.invalid) return;
    const { name, location } = this.pointForm.getRawValue();
    this.save(
      this.api.registerPoint(this.zoneId, { name: name.trim(), location: location.trim() || null }),
      () => this.i18n.t('zone.point.saved', { name: name.trim() }),
      'zone.point.conflict',
    );
  }

  saveSensor(pointId: string): void {
    this.submitted.set(true);
    if (this.sensorForm.invalid) return;
    const { deviceCode, interval } = this.sensorForm.getRawValue();
    this.save(
      this.api.registerSensor(this.zoneId, pointId, { deviceCode: deviceCode.trim(), samplingIntervalSeconds: Number(interval) }),
      () => this.i18n.t('zone.sensor.saved', { code: deviceCode.trim() }),
      'zone.sensor.conflict',
    );
  }

  private save(request: Observable<unknown>, confirmation: () => string, conflictKey: string): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.formError.set(null);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialog.set(null);
        this.saved.set(confirmation());
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(saveErrorKey(error, conflictKey));
      },
    });
  }
}

function toNumber(value: string): number {
  return Number(value.replace(',', '.'));
}
