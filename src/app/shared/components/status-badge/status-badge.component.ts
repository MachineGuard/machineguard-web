import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconComponent, IconName } from '../icon/icon.component';
export type StatusTone = 'normal' | 'near-limit' | 'out-of-range' | 'offline';
@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span
    [class]="'status-badge ' + tone"
    [class.monospace]="monospace"
    [class.solid]="solid"
    ><app-icon [name]="icons[tone]" />{{ label }}</span
  >`,
})
export class StatusBadgeComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) tone!: StatusTone;
  @Input() monospace = false;
  @Input() solid = false;
  readonly icons: Record<StatusTone, IconName> = {
    normal: 'check-circle',
    'near-limit': 'incidents',
    'out-of-range': 'error',
    offline: 'offline',
  };
}
