import { InjectionToken } from '@angular/core';

export interface ApiConfig {
  baseUrl: string;
  /** Set only after validating the Core API contract. */
  monitoringSnapshotPath?: string;
}
export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG', {
  providedIn: 'root',
  factory: () => ({ baseUrl: 'http://localhost:8080/api/v1' }),
});
