import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, Observable, of, shareReplay, tap, throwError } from 'rxjs';
import { AuthSession, Credentials } from '../../domain/models/auth-session';
import { AuthApiClient } from '../../infrastructure/api/auth-api.client';
import { SessionStore } from '../../infrastructure/auth/session.store';
import { AuthContextService } from './auth-context.service';

export const LOGIN_PATH = '/login';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly api = inject(AuthApiClient);
  private readonly store = inject(SessionStore);
  private readonly context = inject(AuthContextService);
  private readonly router = inject(Router);
  private readonly current = signal<AuthSession | null>(null);
  private refreshing: Observable<AuthSession> | null = null;

  readonly session = this.current.asReadonly();
  readonly isAuthenticated = computed(() => this.current() !== null);

  constructor() {
    this.apply(this.store.read());
  }

  login(credentials: Credentials): Observable<AuthSession> {
    return this.api.login(credentials).pipe(tap((session) => this.apply(session)));
  }

  /** Concurrent callers share one request: a rotated refresh token can only be used once. */
  refresh(): Observable<AuthSession> {
    const session = this.current();
    if (!session) return throwError(() => new Error('No active session'));
    this.refreshing ??= this.api.refresh(session.refreshToken).pipe(
      tap((renewed) => this.apply(renewed)),
      finalize(() => (this.refreshing = null)),
      shareReplay(1),
    );
    return this.refreshing;
  }

  /** Revokes the session in IAM when possible and always signs out locally. */
  logout(): void {
    const session = this.current();
    if (session) this.api.logout(session.refreshToken).pipe(catchError(() => of(undefined))).subscribe();
    this.end();
  }

  /** Local sign-out for a session IAM no longer accepts. */
  end(): void {
    this.apply(null);
    void this.router.navigateByUrl(LOGIN_PATH);
  }

  private apply(session: AuthSession | null): void {
    this.current.set(session);
    this.store.write(session);
    this.context.setContext(
      session
        ? { accessToken: session.accessToken, organizationId: session.organization.id, userId: session.user.id }
        : null,
    );
  }
}
