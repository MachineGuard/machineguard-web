import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../../../core/http/api-client';
import { CorrectiveAction, Incident } from '../../domain/models/alert.models';
import { IncidentFilters } from '../../domain/repositories/incident.repository';
import { IncidentDetailDto } from './alert-incident.dto';

@Injectable({ providedIn: 'root' })
export class IncidentsApiClient {
  private readonly api = inject(ApiClient);
  list(filters: IncidentFilters) {
    const params: Record<string, string> = { limit: '500' };
    if (filters.monitoringZoneId) params['monitoringZoneId'] = filters.monitoringZoneId;
    if (filters.status) params['status'] = filters.status;
    if (filters.from) params['from'] = filters.from;
    if (filters.to) params['to'] = filters.to;
    return this.api.get<Incident[]>('incidents', params);
  }
  detail(id: string) { return this.api.get<IncidentDetailDto>(`incidents/${encodeURIComponent(id)}`); }
  registerAction(id: string, description: string, notes?: string) {
    return this.api.post<CorrectiveAction>(`incidents/${encodeURIComponent(id)}/corrective-actions`, { description, notes });
  }
  resolve(id: string, notes?: string) {
    return this.api.post<Incident>(`incidents/${encodeURIComponent(id)}/resolve`, { notes });
  }
}
