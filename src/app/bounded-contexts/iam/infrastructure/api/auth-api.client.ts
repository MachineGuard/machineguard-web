import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiClient } from '../../../../core/http/api-client';
import { AuthSession, Credentials, UserRole } from '../../domain/models/auth-session';

/** Subset of the Core API AuthenticationResource consumed by the web application. */
export interface AuthenticationDto {
  accessToken: string;
  refreshToken: string;
  user: { id: string; organizationId: string; email: string; fullName: string; role: UserRole };
  organization: { id: string; name: string };
}

export const AUTH_PATHS = {
  login: 'auth/login',
  refresh: 'auth/refresh',
  logout: 'auth/logout',
};

@Injectable({ providedIn: 'root' })
export class AuthApiClient {
  private readonly api = inject(ApiClient);

  login(credentials: Credentials): Observable<AuthSession> {
    return this.api.post<AuthenticationDto>(AUTH_PATHS.login, credentials).pipe(map(toSession));
  }

  /** The Core API rotates the refresh token: the previous one stops being valid. */
  refresh(refreshToken: string): Observable<AuthSession> {
    return this.api.post<AuthenticationDto>(AUTH_PATHS.refresh, { refreshToken }).pipe(map(toSession));
  }

  logout(refreshToken: string): Observable<void> {
    return this.api.post<void>(AUTH_PATHS.logout, { refreshToken });
  }
}

function toSession(dto: AuthenticationDto): AuthSession {
  return {
    accessToken: dto.accessToken,
    refreshToken: dto.refreshToken,
    user: {
      id: dto.user.id,
      organizationId: dto.user.organizationId,
      email: dto.user.email,
      fullName: dto.user.fullName,
      role: dto.user.role,
    },
    organization: { id: dto.organization.id, name: dto.organization.name },
  };
}
