import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../../../core/http/api-client';
import { AcknowledgementDto, AlertDto } from './alert-incident.dto';

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
  acknowledge(id: string) {
    return this.api.post<AcknowledgementDto>(ALERT_PATHS.acknowledgement(id), {});
  }
}
