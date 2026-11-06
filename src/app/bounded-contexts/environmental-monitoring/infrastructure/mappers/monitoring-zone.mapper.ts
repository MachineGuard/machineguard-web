import { MonitoringSnapshot } from '../../domain/models/monitoring.models';
import { EnvironmentalVariableDto, MonitoringZoneDto } from '../api/monitoring-zone.dto';

/** REST vocabulary stays here; application projections and templates only use domain/view models. */
export function zonesToMonitoringSnapshot(zones: MonitoringZoneDto[]): MonitoringSnapshot {
  return {
    zones: zones.map(zone => ({
      id: zone.id, name: zone.name, description: zone.description ?? '',
      reportedStatus: ['NORMAL','NEAR_LIMIT','OUT_OF_RANGE','OFFLINE','STALE','NO_DATA'].includes(zone.environmentalCondition)
        ? (['NORMAL','NEAR_LIMIT'].includes(zone.environmentalCondition) && zone.freshness !== 'FRESH' ? 'UNKNOWN' : zone.environmentalCondition) : 'UNKNOWN',
      freshness: zone.freshness ?? 'UNKNOWN',
      lastUpdatedAt: zone.lastUpdatedAt ?? undefined,
      sensorCounts: { online: zone.sensorsOnline, offline: zone.sensorsOffline },
    })),
    points: zones.flatMap(zone => zone.points.map(point => ({
      id: point.id, monitoringZoneId: zone.id, name: point.name,
    }))),
    nodes: zones.flatMap(zone => zone.sensors.map(node => ({
      id: node.id, monitoringPointId: node.monitoringPointId, status: node.status,
      lastSeenAt: node.lastReceivedAt ?? undefined, administrativeStatus: node.administrativeStatus,
      availability: node.availability, receivedAgeSeconds: node.receivedAgeSeconds ?? undefined, freshnessWindowSeconds: node.freshnessWindowSeconds,
    }))),
    thresholds: zones.flatMap(zone => zone.thresholds.map(threshold => ({
      id: threshold.id, monitoringZoneId: zone.id,
      environmentalVariable: toVariable(threshold.environmentalVariable),
      safeRange: { min: threshold.minimumValue, max: threshold.maximumValue },
    }))),
    measurements: zones.flatMap(zone => {
      const physical=(zone.latestPhysicalMeasurements ?? []).filter(reading=>zone.sensors.some(n=>n.id===reading.sensorNodeId && n.status!=='INACTIVE')
        && zone.points.some(p=>p.id===reading.monitoringPointId && p.status==='ACTIVE'));
      const current=physical.filter(reading=>reading.freshness==='FRESH');
      const readings=current.length?current:physical.length?physical:zone.latestMeasurements;
      return readings.map(reading => ({
      id: reading.id, organizationId: reading.organizationId, monitoringZoneId: reading.monitoringZoneId,
      monitoringPointId: reading.monitoringPointId, environmentalVariable: toVariable(reading.environmentalVariable),
      measuredValue: reading.measuredValue, recordedAt: reading.recordedAt, receivedAt: reading.receivedAt,
      source: reading.source ?? 'LEGACY_UNKNOWN', freshness: reading.freshness ?? 'UNKNOWN',
      capturedAgeSeconds: reading.capturedAgeSeconds, receivedAgeSeconds: reading.receivedAgeSeconds,
    }));}),
  };
}
function toVariable(variable: EnvironmentalVariableDto) {
  return variable === 'HUMIDITY' ? 'RELATIVE_HUMIDITY' as const : 'TEMPERATURE' as const;
}
