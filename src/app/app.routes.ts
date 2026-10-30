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
    title: 'title.login',
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
        title: 'title.zones',
        loadComponent: () =>
          import('./bounded-contexts/environmental-monitoring/presentation/pages/zones-list/zones-list.component').then((m) => m.ZonesListComponent),
      },
      {
        path: 'zones/:zoneId',
        title: 'title.zone',
        loadComponent: () =>
          import('./bounded-contexts/environmental-monitoring/presentation/pages/zone-detail/zone-detail.component').then((m) => m.ZoneDetailComponent),
      },
      {
        path: 'alerts',
        title: 'nav.alerts',
        loadComponent: () => import('./bounded-contexts/alert-incident-management/presentation/pages/operations-list/operations-list.component').then(m => m.OperationsListComponent),
        data: { kind: 'alerts' },
      },
      {
        path: 'incidents',
        title: 'nav.incidents',
        loadComponent: () => import('./bounded-contexts/alert-incident-management/presentation/pages/operations-list/operations-list.component').then(m => m.OperationsListComponent),
        data: { kind: 'incidents' },
      },
      {
        path: 'incidents/:incidentId', title: 'nav.incidents',
        loadComponent: () => import('./bounded-contexts/alert-incident-management/presentation/pages/incident-detail/incident-detail.component').then(m => m.IncidentDetailComponent),
      },
      {
        path: 'reports',
        title: 'title.reports',
        loadComponent: () =>
          import('./bounded-contexts/traceability-quality/presentation/pages/excursions-list/excursions-list.component').then((m) => m.ExcursionsListComponent),
      },
      {
        path: 'reports/excursions/:excursionId',
        title: 'title.excursion',
        loadComponent: () =>
          import('./bounded-contexts/traceability-quality/presentation/pages/excursion-detail/excursion-detail.component').then((m) => m.ExcursionDetailComponent),
      },
      {
        path: 'devices',
        loadComponent: placeholder,
        data: {
          title: 'nav.devices',
          context: 'placeholder.context.monitoring',
          description:
            'placeholder.devices',
        },
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
