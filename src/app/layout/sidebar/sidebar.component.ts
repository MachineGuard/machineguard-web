import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AsyncPipe } from '@angular/common';
import { map } from 'rxjs';
import { EnvironmentalMonitoringService } from '../../bounded-contexts/environmental-monitoring/application/services/environmental-monitoring.service';
import {
  inject,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IconComponent,
  IconName,
} from '../../shared/components/icon/icon.component';

@Component({
    selector: 'app-sidebar',
    imports: [AsyncPipe, RouterLink, RouterLinkActive, IconComponent, TranslatePipe],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  readonly systemStatus$ = inject(EnvironmentalMonitoringService).state$.pipe(
    map((state) => ({
      unconfirmed:state.status==='error' || state.status==='loading',
      online: state.zones.reduce((count, zone) => count + zone.onlineNodes, 0),
      offline: state.zones.reduce((count, zone) => count + zone.offlineNodes, 0),
      total: state.zones.reduce(
        (count, zone) => count + zone.onlineNodes + zone.offlineNodes,
        0,
      ),
    })),
  );
  @Input() open = false;
  @Output() navigated = new EventEmitter<void>();
  readonly links: { label: string; path: string; icon: IconName }[] = [
    { label: 'nav.dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'nav.zones', path: '/zones', icon: 'zones' },
    { label: 'nav.alerts', path: '/alerts', icon: 'alerts' },
    { label: 'nav.incidents', path: '/incidents', icon: 'incidents' },
    { label: 'nav.reports', path: '/reports', icon: 'reports' },
    { label: 'trace.history', path: '/history', icon: 'reports' },
    { label: 'trace.reports', path: '/reports/sealed', icon: 'reports' },
    { label: 'nav.devices', path: '/devices', icon: 'devices' },
  ];
}
