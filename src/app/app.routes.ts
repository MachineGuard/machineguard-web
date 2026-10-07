import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

const placeholder = () =>
  import(
    './shared/components/feature-placeholder/feature-placeholder.component'
  ).then((m) => m.FeaturePlaceholderComponent);
export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import(
            './dashboard/pages/environmental-dashboard/environmental-dashboard.component'
          ).then((m) => m.EnvironmentalDashboardComponent),
      },
      {
        path: 'zones',
        loadComponent: placeholder,
        data: {
          title: 'Zones',
          context: 'Environmental Monitoring',
          description:
            'Monitoring zones, monitored points and safe ranges will be managed here.',
        },
      },
      {
        path: 'alerts',
        loadComponent: placeholder,
        data: {
          title: 'Alerts',
          context: 'Alert & Incident Management',
          description:
            'The complete alert list and acknowledgement history will be available here.',
        },
      },
      {
        path: 'incidents',
        loadComponent: placeholder,
        data: {
          title: 'Incidents',
          context: 'Alert & Incident Management',
          description:
            'Incident tracking and corrective actions will be available here.',
        },
      },
      {
        path: 'reports',
        loadComponent: placeholder,
        data: {
          title: 'Reports',
          context: 'Traceability & Quality',
          description:
            'Excursions, measurement history and traceability reports will be available here.',
        },
      },
      {
        path: 'devices',
        loadComponent: placeholder,
        data: {
          title: 'Devices',
          context: 'Environmental Monitoring',
          description:
            'Sensor nodes, gateway connectivity and device status will be managed here.',
        },
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
