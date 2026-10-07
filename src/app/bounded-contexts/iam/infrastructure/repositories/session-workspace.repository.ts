import { inject, Injectable } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { SessionService } from '../../application/services/session.service';
import { WorkspaceProfile } from '../../domain/models/workspace-profile';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';

/** Workspace identity of the signed-in user; `role` and `warehouseName` are translation keys. IAM has no facility model yet. */
@Injectable()
export class SessionWorkspaceRepository implements WorkspaceRepository {
  private readonly profile$ = toObservable(inject(SessionService).session).pipe(
    filter((session) => session !== null),
    map(
      (session): WorkspaceProfile => ({
        displayName: session.user.fullName,
        role: `role.${session.user.role}`,
        facilityName: session.organization.name,
        warehouseName: 'header.allZones',
        preview: false,
      }),
    ),
  );

  getProfile() {
    return this.profile$;
  }
}
