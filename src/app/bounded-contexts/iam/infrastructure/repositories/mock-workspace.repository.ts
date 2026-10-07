import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { WorkspaceRepository } from '../../domain/repositories/workspace.repository';

/** Presentation fixture only. Does not establish an authenticated identity. */
@Injectable()
export class MockWorkspaceRepository implements WorkspaceRepository {
  getProfile() {
    return of({
      displayName: 'Alex Morgan',
      role: 'Facility Lead',
      facilityName: 'Main Logistics Hub',
      warehouseName: 'Warehouse 04',
      preview: true,
    });
  }
}
