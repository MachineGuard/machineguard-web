import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { IncidentFilters, IncidentRepository } from '../../domain/repositories/incident.repository';
import { IncidentsApiClient } from '../api/incidents-api.client';
import { incidentDetailFromDto } from '../mappers/alert-incident.mapper';

@Injectable()
export class ApiIncidentRepository implements IncidentRepository {
  private readonly client = inject(IncidentsApiClient);
  list(filters: IncidentFilters) { return this.client.list(filters); }
  detail(id: string) { return this.client.detail(id).pipe(map(incidentDetailFromDto)); }
  registerAction(id: string, description: string, notes?: string) { return this.client.registerAction(id, description, notes); }
  resolve(id: string, notes?: string) { return this.client.resolve(id, notes); }
}
