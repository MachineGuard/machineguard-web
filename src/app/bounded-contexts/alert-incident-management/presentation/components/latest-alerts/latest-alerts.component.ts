import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { DatePipe } from '@angular/common';
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
  imports: [RouterLink, DatePipe, StatusBadgeComponent, IconComponent],
  templateUrl: './latest-alerts.component.html',
  styleUrl: './latest-alerts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LatestAlertsComponent {
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
    CRITICAL: { label: 'Out of range', tone: 'out-of-range' },
    WARNING: { label: 'Near limit', tone: 'near-limit' },
    INFO: { label: 'Normal', tone: 'normal' },
  };
}
