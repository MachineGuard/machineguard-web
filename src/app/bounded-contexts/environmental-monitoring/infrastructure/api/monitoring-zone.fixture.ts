import { MonitoringZoneDto } from './monitoring-zone.dto';

/** Test-only fixture matching Core's ZoneResource; not imported by runtime code. */
export function zoneFixture(): MonitoringZoneDto {
  return {
    id: '00000000-0000-0000-0000-000000000010', organizationId: '00000000-0000-0000-0000-000000000001',
    facilityId: null, name: 'Cold Room A', description: 'Storage', status: 'ACTIVE', environmentalCondition: 'OUT_OF_RANGE',
    sensorsOnline: 1, sensorsOffline: 0, sensorsInactive: 1, lastUpdatedAt: '2026-10-01T11:00:00Z',
    points: [{ id: 'p1', name: 'Shelf A', location: null, status: 'ACTIVE' }],
    sensors: [
      { id: 's1', monitoringPointId: 'p1', deviceCode: 'MG-01', samplingIntervalSeconds: 60, status: 'ONLINE', lastMeasurementAt: '2026-10-01T11:00:00Z' },
      { id: 's2', monitoringPointId: 'p1', deviceCode: 'MG-02', samplingIntervalSeconds: 60, status: 'INACTIVE', lastMeasurementAt: null },
    ],
    thresholds: [
      { id: 't1', environmentalVariable: 'TEMPERATURE', minimumValue: 2, maximumValue: 8 },
      { id: 't2', environmentalVariable: 'HUMIDITY', minimumValue: 35, maximumValue: 60 },
    ],
    latestMeasurements: [
      { id: 'm1', organizationId: 'o1', monitoringZoneId: '00000000-0000-0000-0000-000000000010', monitoringPointId: 'p1', sensorNodeId: 's1', environmentalVariable: 'TEMPERATURE', measuredValue: 11.2, recordedAt: '2026-10-01T11:00:00Z', receivedAt: '2026-10-01T12:00:00Z' },
      { id: 'm2', organizationId: 'o1', monitoringZoneId: '00000000-0000-0000-0000-000000000010', monitoringPointId: 'p1', sensorNodeId: 's1', environmentalVariable: 'HUMIDITY', measuredValue: 50, recordedAt: '2026-10-01T11:00:00Z', receivedAt: '2026-10-01T12:00:00Z' },
    ],
  };
}
