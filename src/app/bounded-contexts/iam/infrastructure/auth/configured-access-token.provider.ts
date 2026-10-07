import { inject, Injectable } from '@angular/core';
import { AccessTokenProvider } from '../../application/ports/access-token.provider';
import { AuthContextService } from '../../application/services/auth-context.service';
import { DevelopmentTokenStore } from './development-token.store';

@Injectable({ providedIn: 'root' })
export class ConfiguredAccessTokenProvider implements AccessTokenProvider {
  private readonly auth = inject(AuthContextService);
  private readonly development = inject(DevelopmentTokenStore);

  getAccessToken(): string | null {
    return this.auth.context()?.accessToken?.trim() || this.development.getAccessToken();
  }
}
