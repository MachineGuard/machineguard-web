import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { CorrectiveAction, Incident, IncidentDetail, IncidentStatus } from '../models/alert.models';

export interface IncidentFilters { monitoringZoneId?: string; status?: IncidentStatus; }
export interface IncidentRepository {
  list(filters: IncidentFilters): Observable<Incident[]>;
  detail(id: string): Observable<IncidentDetail>;
  registerAction(id: string, description: string, notes?: string): Observable<CorrectiveAction>;
  resolve(id: string, notes?: string): Observable<Incident>;
}
export const INCIDENT_REPOSITORY = new InjectionToken<IncidentRepository>('INCIDENT_REPOSITORY');
