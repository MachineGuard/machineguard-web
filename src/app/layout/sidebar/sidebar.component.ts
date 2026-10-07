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
  standalone: true,
  imports: [AsyncPipe, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  readonly systemStatus$ = inject(EnvironmentalMonitoringService).zones$.pipe(
    map((zones) => ({
      online: zones.reduce((count, zone) => count + zone.onlineNodes, 0),
      offline: zones.reduce((count, zone) => count + zone.offlineNodes, 0),
      total: zones.reduce(
        (count, zone) => count + zone.onlineNodes + zone.offlineNodes,
        0,
      ),
    })),
  );
  @Input() open = false;
  @Output() navigated = new EventEmitter<void>();
  readonly links: { label: string; path: string; icon: IconName }[] = [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Zones', path: '/zones', icon: 'zones' },
    { label: 'Alerts', path: '/alerts', icon: 'alerts' },
    { label: 'Incidents', path: '/incidents', icon: 'incidents' },
    { label: 'Reports', path: '/reports', icon: 'reports' },
    { label: 'Devices', path: '/devices', icon: 'devices' },
  ];
}
