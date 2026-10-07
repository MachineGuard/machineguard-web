export type EnvironmentalVariable = 'TEMPERATURE' | 'RELATIVE_HUMIDITY';
export type ZoneStatus = 'NORMAL' | 'NEAR_LIMIT' | 'OUT_OF_RANGE' | 'OFFLINE';
export interface MonitoringZone {
  id: string;
  name: string;
  description: string;
  deviationStartedAt?: string;
  reportedStatus?: ZoneStatus;
  lastUpdatedAt?: string;
  sensorCounts?: { online: number; offline: number };
}
export interface MonitoringPoint {
  id: string;
  monitoringZoneId: string;
  name: string;
}
export interface SensorNode {
  id: string;
  monitoringPointId: string;
  status: 'ONLINE' | 'OFFLINE' | 'INACTIVE';
  lastSeenAt?: string;
}
export interface Measurement {
  id: string;
  organizationId: string;
  monitoringZoneId: string;
  monitoringPointId: string;
  environmentalVariable: EnvironmentalVariable;
  measuredValue: number;
  recordedAt: string;
}
export interface SafeRange {
  min: number;
  max: number;
}
export interface Threshold {
  id: string;
  monitoringZoneId: string;
  environmentalVariable: EnvironmentalVariable;
  safeRange: SafeRange;
}
export interface Deviation {
  monitoringZoneId: string;
  environmentalVariable: EnvironmentalVariable;
  measuredValue: number;
  safeRange: SafeRange;
}
export interface MonitoringSnapshot {
  zones: MonitoringZone[];
  points: MonitoringPoint[];
  nodes: SensorNode[];
  measurements: Measurement[];
  thresholds: Threshold[];
}
