import { Injectable, signal } from '@angular/core';
import { AuthContext } from '../../domain/models/workspace-profile';

/** Future IAM boundary. The presentation mock never populates credentials. */
@Injectable({ providedIn: 'root' })
export class AuthContextService {
  readonly context = signal<AuthContext | null>(null);
  setContext(context: AuthContext | null): void {
    this.context.set(context);
  }
}
