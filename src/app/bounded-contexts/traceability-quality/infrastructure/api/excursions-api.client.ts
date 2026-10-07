import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../../core/http/api-client';
import { EnvironmentalVariable } from '../../../../shared/format/presentation';

export type ExcursionStatus = 'ONGOING' | 'CLOSED';
export type ExcursionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ExcursionDto {
  id: string;
  monitoringZoneId: string;
  monitoringPointId: string;
  environmentalVariable: EnvironmentalVariable;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  peakValue: number;
  thresholdValue: number;
  severity: ExcursionSeverity;
  status: ExcursionStatus;
  incidentId: string | null;
  correctiveAction: string | null;
}

export interface NonConformityDto {
  id: string;
  batchCode: string;
  productName: string | null;
  classification: string;
  disposition: string | null;
  registeredAt: string;
}

export interface ExcursionDetailDto {
  excursion: ExcursionDto;
  nonConformities: NonConformityDto[];
}

export interface MeasurementHistoryDto {
  count: number;
  measurements: { monitoringPointId: string; environmentalVariable: EnvironmentalVariable; value: number; recordedAt: string }[];
}

const EXCURSIONS = 'traceability/excursions';

@Injectable({ providedIn: 'root' })
export class ExcursionsApiClient {
  private readonly api = inject(ApiClient);

  getExcursions(filter: { monitoringZoneId?: string; status?: ExcursionStatus }): Observable<ExcursionDto[]> {
    const params: Record<string, string> = {};
    if (filter.monitoringZoneId) params['monitoringZoneId'] = filter.monitoringZoneId;
    if (filter.status) params['status'] = filter.status;
    return this.api.get<ExcursionDto[]>(EXCURSIONS, params);
  }

  getExcursion(excursionId: string): Observable<ExcursionDetailDto> {
    return this.api.get<ExcursionDetailDto>(`${EXCURSIONS}/${excursionId}`);
  }

  getMeasurementHistory(excursionId: string): Observable<MeasurementHistoryDto> {
    return this.api.get<MeasurementHistoryDto>(`${EXCURSIONS}/${excursionId}/measurement-history`);
  }

  registerNonConformity(excursionId: string, body: { batchCode: string; productName: string | null; classification: string }): Observable<NonConformityDto> {
    return this.api.post<NonConformityDto>(`${EXCURSIONS}/${excursionId}/non-conformities`, body);
  }
}
