import { MonitoringSnapshot } from '../../domain/models/monitoring.models';
import { EnvironmentalVariableDto, MonitoringZoneDto } from '../api/monitoring-zone.dto';

/** REST vocabulary stays here; application projections and templates only use domain/view models. */
export function zonesToMonitoringSnapshot(zones: MonitoringZoneDto[]): MonitoringSnapshot {
  return {
    zones: zones.map(zone => ({
      id: zone.id, name: zone.name, description: zone.description ?? '',
      reportedStatus: zone.environmentalCondition === 'NO_DATA' ? 'OFFLINE' : zone.environmentalCondition,
      lastUpdatedAt: zone.lastUpdatedAt ?? undefined,
      sensorCounts: { online: zone.sensorsOnline, offline: zone.sensorsOffline },
    })),
    points: zones.flatMap(zone => zone.points.map(point => ({
      id: point.id, monitoringZoneId: zone.id, name: point.name,
    }))),
    nodes: zones.flatMap(zone => zone.sensors.map(node => ({
      id: node.id, monitoringPointId: node.monitoringPointId, status: node.status,
      lastSeenAt: node.lastMeasurementAt ?? undefined,
    }))),
    thresholds: zones.flatMap(zone => zone.thresholds.map(threshold => ({
      id: threshold.id, monitoringZoneId: zone.id,
      environmentalVariable: toVariable(threshold.environmentalVariable),
      safeRange: { min: threshold.minimumValue, max: threshold.maximumValue },
    }))),
    measurements: zones.flatMap(zone => zone.latestMeasurements.map(reading => ({
      id: reading.id, organizationId: reading.organizationId, monitoringZoneId: reading.monitoringZoneId,
      monitoringPointId: reading.monitoringPointId, environmentalVariable: toVariable(reading.environmentalVariable),
      measuredValue: reading.measuredValue, recordedAt: reading.recordedAt,
    }))),
  };
}
function toVariable(variable: EnvironmentalVariableDto) {
  return variable === 'HUMIDITY' ? 'RELATIVE_HUMIDITY' as const : 'TEMPERATURE' as const;
}
