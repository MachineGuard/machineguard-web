import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../../../core/http/api-client';
import { AcknowledgementDto, AlertDto } from './alert-incident.dto';
import { AlertFilters } from '../../domain/repositories/alert.repository';

/** Published Core routes; the repository translates transport resources to UI domain models. */
export const ALERT_PATHS = {
  list: 'alerts',
  acknowledgement: (id: string) =>
    `alerts/${encodeURIComponent(id)}/acknowledgements`,
};
@Injectable({ providedIn: 'root' })
export class AlertsApiClient {
  private readonly api = inject(ApiClient);
  getLatest() {
    return this.api.get<AlertDto[]>(ALERT_PATHS.list);
  }
  list(filters: AlertFilters) {
    const params: Record<string, string> = {};
    if (filters.monitoringZoneId) params['monitoringZoneId'] = filters.monitoringZoneId;
    if (filters.status) params['status'] = filters.status;
    return this.api.get<AlertDto[]>(ALERT_PATHS.list, params);
  }
  acknowledge(id: string) {
    return this.api.post<AcknowledgementDto>(ALERT_PATHS.acknowledgement(id), {});
  }
}
