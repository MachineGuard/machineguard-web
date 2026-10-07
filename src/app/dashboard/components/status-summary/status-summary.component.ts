import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { StatusSummaryItem } from '../../models/dashboard.view-model';
import { STATUS_META } from '../../../bounded-contexts/environmental-monitoring/presentation/models/zone-status.presentation';
import {
  IconComponent,
  IconName,
} from '../../../shared/components/icon/icon.component';
import { ZoneStatus } from '../../../bounded-contexts/environmental-monitoring/domain/models/monitoring.models';
@Component({
  selector: 'app-status-summary',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './status-summary.component.html',
  styleUrl: './status-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusSummaryComponent {
  @Input({ required: true }) items!: StatusSummaryItem[];
  readonly meta = STATUS_META;
  readonly descriptions: Record<ZoneStatus, string> = {
    NORMAL: 'Optimal conditions',
    NEAR_LIMIT: 'Approaching max',
    OUT_OF_RANGE: 'Critical excursion',
    OFFLINE: 'Signal dropped',
  };
  readonly icons: Record<ZoneStatus, IconName> = {
    NORMAL: 'check-circle',
    NEAR_LIMIT: 'incidents',
    OUT_OF_RANGE: 'temperature',
    OFFLINE: 'offline',
  };
}
