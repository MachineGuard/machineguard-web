import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AuthApiClient } from '../../infrastructure/api/auth-api.client';

@Injectable({ providedIn: 'root' })
export class AccountActivationService {
  private readonly api = inject(AuthApiClient);

  /** Activates the invited administrator. The user signs in afterwards; no session is opened here. */
  activate(token: string, password: string): Observable<void> {
    return this.api.acceptInvitation(token, password).pipe(map(() => undefined));
  }
}
