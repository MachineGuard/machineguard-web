import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  inject,
  Output,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { I18nService } from '../../../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../../../core/i18n/translate.pipe';
import { MonitoringZoneViewModel } from '../../../application/models/monitoring-zone.view-model';
import { StatusBadgeComponent } from '../../../../../shared/components/status-badge/status-badge.component';
import { STATUS_META } from '../../models/zone-status.presentation';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';
@Component({
  selector: 'app-zone-card',
  standalone: true,
  imports: [DecimalPipe, StatusBadgeComponent, IconComponent, TranslatePipe],
  templateUrl: './zone-card.component.html',
  styleUrl: './zone-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneCardComponent {
  private readonly i18n = inject(I18nService);
  @Input({ required: true }) zone!: MonitoringZoneViewModel;
  @Input() canAcknowledge = false;
  @Input() busy = false;
  @Output() acknowledge = new EventEmitter<string>();
  @Output() viewDetails = new EventEmitter<string>();
  get deviationText(): string {
    const deviation = this.zone.deviation;
    if (!deviation) return this.zone.deviationNote ?? '';
    return this.i18n.t(`deviation.${deviation.direction}`, {
      variable: this.i18n.t(`variable.short.${deviation.variable}`),
      limit: deviation.limit,
      unit: deviation.variable === 'TEMPERATURE' ? ' °C' : ' %',
    });
  }
  get nodesText(): string {
    const online = this.zone.onlineNodes;
    return this.i18n.plural(online ? 'card.nodes.online' : 'card.nodes.offline', online || this.zone.offlineNodes);
  }
  get statusMeta() {
    return STATUS_META[this.zone.status];
  }
}
