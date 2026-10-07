import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type IconName =
  | 'dashboard'
  | 'zones'
  | 'alerts'
  | 'incidents'
  | 'reports'
  | 'devices'
  | 'temperature'
  | 'humidity'
  | 'check'
  | 'offline'
  | 'arrow'
  | 'plus'
  | 'menu'
  | 'shield'
  | 'user'
  | 'clock'
  | 'check-circle'
  | 'error'
  | 'eye'
  | 'eye-off'
  | 'mail'
  | 'logout';
const PATHS: Record<IconName, string> = {
  user: 'M8 7a4 4 0 1 0 8 0 4 4 0 1 0-8 0 M5 21v-2a7 7 0 0 1 14 0v2z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20 M12 6v6l4 2',
  'check-circle': 'M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20 M7 12l3 3 7-7',
  error: 'M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20 M12 7v6 M12 16v1',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12 M9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
  'eye-off':
    'M3 3l18 18 M10.6 5.1A9.8 9.8 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3 3.8 M6.5 6.6C3.7 8.5 2 12 2 12s4 7 10 7c1.7 0 3.2-.5 4.5-1.3 M9.9 9.9a3 3 0 0 0 4.2 4.2',
  mail: 'M3 5h18v14H3z M3 6l9 7 9-7',
  logout: 'M9 21H5V3h4 M16 17l5-5-5-5 M21 12H9',
  dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  zones: 'M3 9l9-6 9 6v12H3z M8 21v-8h8v8 M3 9h18',
  alerts: 'M18 8a6 6 0 0 0-12 0c0 8-3 8-3 10h18c0-2-3-2-3-10 M10 21h4',
  incidents: 'M12 3L2 21h20z M12 9v5 M12 17v1',
  reports: 'M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h8',
  devices:
    'M5 5h14v14H5z M9 9h6v6H9z M9 2v3 M15 2v3 M9 19v3 M15 19v3 M2 9h3 M2 15h3 M19 9h3 M19 15h3',
  temperature: 'M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0 M12 8v10',
  humidity:
    'M12 3C10 7 5 11 5 15a7 7 0 0 0 14 0c0-4-5-8-7-12z M8 15a4 4 0 0 0 4 4',
  check: 'M5 12l4 4L19 6',
  offline: 'M3 3l18 18 M4 8a13 13 0 0 1 16 0 M8 12a7 7 0 0 1 8 0 M11 17h2',
  arrow: 'M5 12h14 M15 8l4 4-4 4',
  plus: 'M12 5v14 M5 12h14',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  shield: 'M12 2l9 4v6c0 5-5 8-9 10-4-2-9-5-9-10V6z M7 12l3 3 7-7',
};
@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="path" /></svg>',
  styles: [
    ':host { display: inline-flex; width: 1.25rem; height: 1.25rem; flex-shrink: 0; } svg { width: 100%; height: 100%; }',
  ],
})
export class IconComponent {
  @Input() name: IconName = 'dashboard';
  get path(): string {
    return PATHS[this.name];
  }
}
