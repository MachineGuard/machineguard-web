import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface ApiConfig {
  baseUrl: string;
  developmentTokenEnabled?: boolean;
}
export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    baseUrl: environment.apiBaseUrl,
    developmentTokenEnabled: environment.developmentTokenEnabled,
  }),
});
