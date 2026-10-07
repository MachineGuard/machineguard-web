import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  inject,
  Output,
} from '@angular/core';
import { I18nService } from '../../../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../../../core/i18n/translate.pipe';
import { RouterLink } from '@angular/router';
import { Alert, AlertSeverity } from '../../../domain/models/alert.models';
import {
  StatusBadgeComponent,
  StatusTone,
} from '../../../../../shared/components/status-badge/status-badge.component';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';
@Component({
  selector: 'app-latest-alerts',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, IconComponent, TranslatePipe],
  templateUrl: './latest-alerts.component.html',
  styleUrl: './latest-alerts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LatestAlertsComponent {
  readonly i18n = inject(I18nService);
  get requiredCount(): number {
    return this.alerts.filter(
      (alert) =>
        alert.severity === 'CRITICAL' &&
        ['PENDING', 'ESCALATED'].includes(alert.status),
    ).length;
  }
  @Input({ required: true }) alerts!: Alert[];
  @Input() busy = false;
  @Output() acknowledge = new EventEmitter<string>();
  @Output() inspect = new EventEmitter<string>();
  readonly statuses: Record<
    AlertSeverity,
    { label: string; tone: StatusTone }
  > = {
    CRITICAL: { label: 'status.OUT_OF_RANGE', tone: 'out-of-range' },
    WARNING: { label: 'status.NEAR_LIMIT', tone: 'near-limit' },
    INFO: { label: 'status.NORMAL', tone: 'normal' },
  };
}
