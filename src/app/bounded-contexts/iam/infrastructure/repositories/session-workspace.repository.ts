import { inject, Injectable } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { SessionService } from '../../application/services/session.service';
import { UserRole } from '../../domain/models/auth-session';
import { WorkspaceProfile } from '../../domain/models/workspace-profile';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';

const ROLE_LABELS: Record<UserRole, string> = { ADMIN: 'Administrator', VIEWER: 'Viewer' };

/** Workspace identity of the signed-in user. IAM has no facility model yet, so zones are not scoped. */
@Injectable()
export class SessionWorkspaceRepository implements WorkspaceRepository {
  private readonly profile$ = toObservable(inject(SessionService).session).pipe(
    filter((session) => session !== null),
    map(
      (session): WorkspaceProfile => ({
        displayName: session.user.fullName,
        role: ROLE_LABELS[session.user.role],
        facilityName: session.organization.name,
        warehouseName: 'All zones',
        preview: false,
      }),
    ),
  );

  getProfile() {
    return this.profile$;
  }
}
