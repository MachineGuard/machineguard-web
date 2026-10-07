import { Injectable } from '@angular/core';
import { AuthSession } from '../../domain/models/auth-session';

/** Keeps the session for the lifetime of the browser tab so a reload does not sign the user out. */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  static readonly storageKey = 'machineguard.session';

  read(): AuthSession | null {
    try {
      const raw = window.sessionStorage.getItem(SessionStore.storageKey);
      const session = raw ? (JSON.parse(raw) as Partial<AuthSession>) : null;
      return session?.accessToken && session.refreshToken && session.user && session.organization
        ? (session as AuthSession)
        : null;
    } catch {
      return null;
    }
  }

  write(session: AuthSession | null): void {
    try {
      if (session) window.sessionStorage.setItem(SessionStore.storageKey, JSON.stringify(session));
      else window.sessionStorage.removeItem(SessionStore.storageKey);
    } catch {
      // Storage unavailable: the session still lives in memory until the tab reloads.
    }
  }
}
