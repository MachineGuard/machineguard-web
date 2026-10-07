import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../../../core/http/api-client';
import { Acknowledgement, Alert } from '../../domain/models/alert.models';

/** Proposed routes only; verify DTOs and acknowledgement payload with Swagger before enabling. */
export const ALERT_PATHS = {
  list: 'alerts',
  acknowledgement: (id: string) =>
    `alerts/${encodeURIComponent(id)}/acknowledgements`,
};
@Injectable({ providedIn: 'root' })
export class AlertsApiClient {
  private readonly api = inject(ApiClient);
  getLatest() {
    return this.api.get<Alert[]>(ALERT_PATHS.list);
  }
  acknowledge(id: string) {
    return this.api.post<Acknowledgement>(ALERT_PATHS.acknowledgement(id), {});
  }
}
