import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../../core/http/api-client';
import { EnvironmentalVariableDto, MonitoringZoneDto } from './monitoring-zone.dto';

type PointDto = MonitoringZoneDto['points'][number];
type SensorDto = MonitoringZoneDto['sensors'][number];
type ThresholdDto = MonitoringZoneDto['thresholds'][number];

const ZONES = 'environmental-monitoring/zones';

@Injectable({ providedIn: 'root' })
export class MonitoringApiClient {
  private readonly api = inject(ApiClient);

  getZones(): Observable<MonitoringZoneDto[]> {
    return this.api.get<MonitoringZoneDto[]>(ZONES);
  }

  getZone(zoneId: string): Observable<MonitoringZoneDto> {
    return this.api.get<MonitoringZoneDto>(`${ZONES}/${zoneId}`);
  }

  registerZone(zone: { name: string; description: string | null }): Observable<MonitoringZoneDto> {
    return this.api.post<MonitoringZoneDto>(ZONES, zone);
  }

  registerPoint(zoneId: string, point: { name: string; location: string | null }): Observable<PointDto> {
    return this.api.post<PointDto>(`${ZONES}/${zoneId}/points`, point);
  }

  registerSensor(zoneId: string, pointId: string, sensor: { deviceCode: string; samplingIntervalSeconds: number }): Observable<SensorDto> {
    return this.api.post<SensorDto>(`${ZONES}/${zoneId}/points/${pointId}/sensors`, sensor);
  }

  /** Creates the Safe Range of the variable or replaces the existing one. */
  configureThreshold(zoneId: string, variable: EnvironmentalVariableDto, range: { minimumValue: number; maximumValue: number }): Observable<ThresholdDto> {
    return this.api.put<ThresholdDto>(`${ZONES}/${zoneId}/thresholds/${variable}`, range);
  }
}
