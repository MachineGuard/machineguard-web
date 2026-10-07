import { firstValueFrom } from 'rxjs';
import { MonitoringSnapshot } from '../../domain/models/monitoring.models';
import { MockMonitoringRepository } from '../../infrastructure/repositories/mock-monitoring.repository';
import { toMonitoringZoneViewModel } from './zone.mapper';

describe('Monitoring zone projection', () => {
  let snapshot: MonitoringSnapshot;
  beforeEach(async () => {
    snapshot = await firstValueFrom(
      new MockMonitoringRepository().watchSnapshot(),
    );
  });

  it('projects separate variables and derives the four demo zone states', () => {
    const zones = snapshot.zones.map((zone) =>
      toMonitoringZoneViewModel(zone, snapshot),
    );
    expect(zones.map((zone) => zone.status)).toEqual([
      'OUT_OF_RANGE',
      'NORMAL',
      'NEAR_LIMIT',
      'OFFLINE',
    ]);
    expect(zones[0].temperature).toBe(11.2);
    expect(zones[0].humidity).toBe(58);
    expect(zones.reduce((total, zone) => total + zone.onlineNodes, 0)).toBe(7);
    expect(zones.reduce((total, zone) => total + zone.offlineNodes, 0)).toBe(1);
    expect(zones[0].temperatureTrend.map((bar) => bar.tone)).toEqual([
      'normal',
      'normal',
      'normal',
      'normal',
      'out-of-range',
      'out-of-range',
    ]);
    expect(zones[3].temperatureTrend).toEqual([]);
    expect(zones[3].lastSeenAt).toBeDefined();
    expect(zones[3].temperature).toBeNull();
    expect(zones[3].humidity).toBeNull();
  });

  it('selects the newest reading even when incoming measurements are unordered', () => {
    const measurement = snapshot.measurements[0];
    snapshot.measurements.push({
      ...measurement,
      id: 'old',
      measuredValue: 99,
      recordedAt: '2020-01-01T00:00:00Z',
    });
    snapshot.measurements.unshift({
      ...measurement,
      id: 'new',
      measuredValue: 5,
      recordedAt: '2099-01-01T00:00:00Z',
    });
    const zone = toMonitoringZoneViewModel(snapshot.zones[0], snapshot);
    expect(zone.temperature).toBe(5);
    expect(zone.status).toBe('NORMAL');
  });

  it('does not present stale readings from an offline point as current conditions', () => {
    const ids = new Set(
      snapshot.points
        .filter((point) => point.monitoringZoneId === snapshot.zones[0].id)
        .map((point) => point.id),
    );
    snapshot.nodes
      .filter((node) => ids.has(node.monitoringPointId))
      .forEach((node) => (node.status = 'OFFLINE'));
    const zone = toMonitoringZoneViewModel(snapshot.zones[0], snapshot);
    expect(zone.status).toBe('OFFLINE');
    expect(zone.temperature).toBeNull();
    expect(zone.lastUpdated).toBeUndefined();
  });

  it('detects humidity excursions without inventing a temperature excursion', () => {
    const zone = snapshot.zones[1];
    const humidity = snapshot.measurements.find(
      (m) =>
        m.monitoringZoneId === zone.id &&
        m.environmentalVariable === 'RELATIVE_HUMIDITY',
    );
    if (!humidity) throw new Error('Missing fixture measurement');
    humidity.measuredValue = 80;
    const projection = toMonitoringZoneViewModel(zone, snapshot);
    expect(projection.status).toBe('OUT_OF_RANGE');
    expect(projection.deviationNote).toBe('Humidity exceeds 75% limit');
  });
});
