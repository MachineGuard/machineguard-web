import { TranslatePipe } from '../../../core/i18n/translate.pipe';
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
  imports: [IconComponent, TranslatePipe],
  templateUrl: './status-summary.component.html',
  styleUrl: './status-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusSummaryComponent {
  @Input({ required: true }) items!: StatusSummaryItem[];
  readonly meta = STATUS_META;
  readonly icons: Record<ZoneStatus, IconName> = {
    NORMAL: 'check-circle',
    NEAR_LIMIT: 'incidents',
    OUT_OF_RANGE: 'temperature',
    OFFLINE: 'offline',
  };
}
