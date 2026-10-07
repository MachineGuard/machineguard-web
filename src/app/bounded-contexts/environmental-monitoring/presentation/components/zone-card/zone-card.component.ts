import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { DecimalPipe, I18nPluralPipe } from '@angular/common';
import { MonitoringZoneViewModel } from '../../../application/models/monitoring-zone.view-model';
import { StatusBadgeComponent } from '../../../../../shared/components/status-badge/status-badge.component';
import { STATUS_META } from '../../models/zone-status.presentation';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';
@Component({
  selector: 'app-zone-card',
  standalone: true,
  imports: [I18nPluralPipe, DecimalPipe, StatusBadgeComponent, IconComponent],
  templateUrl: './zone-card.component.html',
  styleUrl: './zone-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneCardComponent {
  readonly nodePlural = { '=1': 'node', other: 'nodes' };
  @Input({ required: true }) zone!: MonitoringZoneViewModel;
  @Input() canAcknowledge = false;
  @Input() busy = false;
  @Output() acknowledge = new EventEmitter<string>();
  @Output() viewDetails = new EventEmitter<string>();
  get statusMeta() {
    return STATUS_META[this.zone.status];
  }
}
