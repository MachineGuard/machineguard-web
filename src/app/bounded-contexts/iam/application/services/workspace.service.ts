import { inject, Injectable } from '@angular/core';
import { WORKSPACE_REPOSITORY } from '../../domain/repositories/workspace.repository';

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  readonly profile$ = inject(WORKSPACE_REPOSITORY).getProfile();
}
