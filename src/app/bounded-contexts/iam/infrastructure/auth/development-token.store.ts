import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../../../../core/config/api.config';

/** Temporary local-development adapter. Disabled in production; never bundled with a token. */
@Injectable({ providedIn: 'root' })
export class DevelopmentTokenStore {
  private readonly config = inject(API_CONFIG);
  static readonly storageKey = 'machineguard.development.jwt';

  getAccessToken(): string | null {
    if (!this.config.developmentTokenEnabled || typeof window === 'undefined') return null;
    try {
      return window.sessionStorage.getItem(DevelopmentTokenStore.storageKey)?.trim() || null;
    } catch {
      return null;
    }
  }
}
