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
    { label: 'Panel', path: '/dashboard', icon: 'dashboard' },
    { label: 'Zonas', path: '/zones', icon: 'zones' },
    { label: 'Alertas', path: '/alerts', icon: 'alerts' },
    { label: 'Incidentes', path: '/incidents', icon: 'incidents' },
    { label: 'Reportes', path: '/reports', icon: 'reports' },
    { label: 'Dispositivos', path: '/devices', icon: 'devices' },
  ];
}
