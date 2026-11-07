import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../../../core/http/api-client';
import { EnvironmentalVariable } from '../../../../shared/format/presentation';

export interface HistoryFilter { monitoringZoneId: string; from: string; to: string; variable?: EnvironmentalVariable }
export interface HistoryDto {
  monitoringZoneId: string; from: string; to: string; count: number;
  measurements: { monitoringPointId: string; environmentalVariable: EnvironmentalVariable; value: number; recordedAt: string }[];
}
export interface ReportPeriod { monitoringZoneId: string; periodStart: string; periodEnd: string }
export interface ReportDto extends ReportPeriod {
  id: string; generatedBy: string; generatedAt: string; excursionCount: number; measurementCount: number;
  status: string; checksum: string; integrityVerified: boolean; excursionIds: string[]; content?: unknown;
}

@Injectable({ providedIn: 'root' })
export class TraceabilityApiClient {
  private readonly api = inject(ApiClient);
  history(filter: HistoryFilter) {
    const params: Record<string, string> = { monitoringZoneId: filter.monitoringZoneId, from: filter.from, to: filter.to };
    if (filter.variable) params['variable'] = filter.variable;
    return this.api.get<HistoryDto>('traceability/measurement-history', params);
  }
  reports(monitoringZoneId?: string) {
    return this.api.get<ReportDto[]>('traceability/reports', monitoringZoneId ? { monitoringZoneId } : {});
  }
  report(id: string) { return this.api.get<ReportDto>(`traceability/reports/${encodeURIComponent(id)}`); }
  generate(body: ReportPeriod) { return this.api.post<ReportDto>('traceability/reports', body); }
  download(id: string) { return this.api.download(`traceability/reports/${encodeURIComponent(id)}/download`); }
}
