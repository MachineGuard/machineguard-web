import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard, guestGuard } from './bounded-contexts/iam/presentation/guards/auth.guard';

const placeholder = () =>
  import(
    './shared/components/feature-placeholder/feature-placeholder.component'
  ).then((m) => m.FeaturePlaceholderComponent);
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'MachineGuard | Iniciar sesión',
    loadComponent: () =>
      import(
        './bounded-contexts/iam/presentation/pages/login/login.component'
      ).then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
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
        title: 'MachineGuard | Zonas',
        loadComponent: () =>
          import('./bounded-contexts/environmental-monitoring/presentation/pages/zones-list/zones-list.component').then((m) => m.ZonesListComponent),
      },
      {
        path: 'zones/:zoneId',
        title: 'MachineGuard | Zona',
        loadComponent: () =>
          import('./bounded-contexts/environmental-monitoring/presentation/pages/zone-detail/zone-detail.component').then((m) => m.ZoneDetailComponent),
      },
      {
        path: 'alerts',
        loadComponent: placeholder,
        data: {
          title: 'Alertas',
          context: 'Alert & Incident Management',
          description:
            'La lista completa de alertas y su historial de reconocimiento estarán disponibles aquí.',
        },
      },
      {
        path: 'incidents',
        loadComponent: placeholder,
        data: {
          title: 'Incidentes',
          context: 'Alert & Incident Management',
          description:
            'El seguimiento de incidentes y las acciones correctivas estarán disponibles aquí.',
        },
      },
      {
        path: 'reports',
        title: 'MachineGuard | Reportes',
        loadComponent: () =>
          import('./bounded-contexts/traceability-quality/presentation/pages/excursions-list/excursions-list.component').then((m) => m.ExcursionsListComponent),
      },
      {
        path: 'reports/excursions/:excursionId',
        title: 'MachineGuard | Excursión',
        loadComponent: () =>
          import('./bounded-contexts/traceability-quality/presentation/pages/excursion-detail/excursion-detail.component').then((m) => m.ExcursionDetailComponent),
      },
      {
        path: 'devices',
        loadComponent: placeholder,
        data: {
          title: 'Dispositivos',
          context: 'Environmental Monitoring',
          description:
            'Los nodos sensores, la conectividad del gateway y el estado de los dispositivos se gestionarán aquí.',
        },
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
