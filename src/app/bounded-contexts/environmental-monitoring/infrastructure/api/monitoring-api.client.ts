import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { API_CONFIG } from '../../../../core/config/api.config';
import { ApiClient } from '../../../../core/http/api-client';
import { MonitoringSnapshot } from '../../domain/models/monitoring.models';

/** Inactive adapter scaffold. Replace transport shape/mapping when Swagger is available. */
@Injectable({ providedIn: 'root' })
export class MonitoringApiClient {
  private readonly api = inject(ApiClient);
  private readonly config = inject(API_CONFIG);
  getSnapshot(): Observable<MonitoringSnapshot> {
    const path = this.config.monitoringSnapshotPath;
    return path
      ? this.api.get<MonitoringSnapshot>(path)
      : throwError(
          () =>
            new Error(
              'Environmental Monitoring API contract is not configured.',
            ),
        );
  }
}
