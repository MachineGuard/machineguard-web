import { environment } from '../environments/environment';
import { ApiMonitoringRepository } from './bounded-contexts/environmental-monitoring/infrastructure/repositories/api-monitoring.repository';
import { ACCESS_TOKEN_PROVIDER } from './bounded-contexts/iam/application/ports/access-token.provider';
import { ConfiguredAccessTokenProvider } from './bounded-contexts/iam/infrastructure/auth/configured-access-token.provider';
import { WORKSPACE_REPOSITORY } from './bounded-contexts/iam/domain/repositories/workspace.repository';
import { MockWorkspaceRepository } from './bounded-contexts/iam/infrastructure/repositories/mock-workspace.repository';
import { SessionWorkspaceRepository } from './bounded-contexts/iam/infrastructure/repositories/session-workspace.repository';
import { sessionRefreshInterceptor } from './bounded-contexts/iam/infrastructure/interceptors/session-refresh.interceptor';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { apiContextInterceptor } from './core/interceptors/api-context.interceptor';
import { MONITORING_REPOSITORY } from './bounded-contexts/environmental-monitoring/domain/repositories/monitoring.repository';
import { MockMonitoringRepository } from './bounded-contexts/environmental-monitoring/infrastructure/repositories/mock-monitoring.repository';
import { ALERT_REPOSITORY } from './bounded-contexts/alert-incident-management/domain/repositories/alert.repository';
import { MockAlertRepository } from './bounded-contexts/alert-incident-management/infrastructure/repositories/mock-alert.repository';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: WORKSPACE_REPOSITORY, useClass: environment.monitoringSource === 'mock' ? MockWorkspaceRepository : SessionWorkspaceRepository },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([sessionRefreshInterceptor, apiContextInterceptor])),
    { provide: MONITORING_REPOSITORY, useClass: environment.monitoringSource === 'mock' ? MockMonitoringRepository : ApiMonitoringRepository },
    { provide: ACCESS_TOKEN_PROVIDER, useExisting: ConfiguredAccessTokenProvider },
    { provide: ALERT_REPOSITORY, useClass: MockAlertRepository },
  ],
};
