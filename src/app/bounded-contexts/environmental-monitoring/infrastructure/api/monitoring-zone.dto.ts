export type EnvironmentalVariableDto = 'TEMPERATURE' | 'HUMIDITY';
export interface MeasurementDto {
  id: string;
  organizationId: string;
  monitoringZoneId: string;
  monitoringPointId: string;
  sensorNodeId: string | null;
  environmentalVariable: EnvironmentalVariableDto;
  measuredValue: number;
  recordedAt: string;
  receivedAt: string;
}
export interface MonitoringZoneDto {
  id: string;
  organizationId: string;
  facilityId: string | null;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  environmentalCondition: 'NORMAL' | 'NEAR_LIMIT' | 'OUT_OF_RANGE' | 'OFFLINE' | 'NO_DATA';
  sensorsOnline: number;
  sensorsOffline: number;
  sensorsInactive: number;
  lastUpdatedAt: string | null;
  points: { id: string; name: string; location: string | null; status: 'ACTIVE' | 'INACTIVE' }[];
  sensors: { id: string; monitoringPointId: string; deviceCode: string; samplingIntervalSeconds: number;
    status: 'ONLINE' | 'OFFLINE' | 'INACTIVE'; lastMeasurementAt: string | null }[];
  thresholds: { id: string; environmentalVariable: EnvironmentalVariableDto; minimumValue: number; maximumValue: number }[];
  latestMeasurements: MeasurementDto[];
}
