import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkspaceProfile } from '../models/workspace-profile';

export interface WorkspaceRepository {
  getProfile(): Observable<WorkspaceProfile>;
}
export const WORKSPACE_REPOSITORY = new InjectionToken<WorkspaceRepository>(
  'WORKSPACE_REPOSITORY',
);
