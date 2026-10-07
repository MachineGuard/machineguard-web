import { zoneFixture } from '../api/monitoring-zone.fixture';
import { zonesToMonitoringSnapshot } from './monitoring-zone.mapper';
import { toMonitoringZoneViewModel } from '../../application/services/zone.mapper';

describe('Core zones REST mapping', () => {
  it('maps independent humidity rows and thresholds without coupling view models to DTOs', () => {
    const snapshot = zonesToMonitoringSnapshot([zoneFixture()]);
    const vm = toMonitoringZoneViewModel(snapshot.zones[0], snapshot);
    expect(vm.temperature).toBe(11.2); expect(vm.humidity).toBe(50); expect(vm.status).toBe('OUT_OF_RANGE');
    expect(vm.minTemperature).toBe(2); expect(vm.maxTemperature).toBe(8);
    expect(vm.onlineNodes).toBe(1); expect(vm.offlineNodes).toBe(0);
    expect(snapshot.measurements[1].environmentalVariable).toBe('RELATIVE_HUMIDITY');
    expect(vm.excursionMinutes).toBeUndefined(); expect(vm.temperatureTrend.length).toBe(1);
  });
  it('hides stale offline readings while retaining the actual last update', () => {
    const dto = zoneFixture(); dto.environmentalCondition = 'OFFLINE'; dto.sensorsOnline = 0; dto.sensorsOffline = 1;
    dto.sensors[0].status = 'OFFLINE';
    const snapshot = zonesToMonitoringSnapshot([dto]); const vm = toMonitoringZoneViewModel(snapshot.zones[0], snapshot);
    expect(vm.temperature).toBeNull(); expect(vm.humidity).toBeNull(); expect(vm.status).toBe('OFFLINE');
    expect(vm.lastUpdated).toBe(dto.lastUpdatedAt!); expect(vm.offlineNodes).toBe(1);
  });
  it('uses Core status and supports sensorless readings', () => {
    const dto = zoneFixture(); dto.sensors = []; dto.sensorsOnline = 0; dto.sensorsInactive = 0;
    dto.environmentalCondition = 'NORMAL'; dto.latestMeasurements[0].measuredValue = 5;
    const snapshot = zonesToMonitoringSnapshot([dto]); const vm = toMonitoringZoneViewModel(snapshot.zones[0], snapshot);
    expect(vm.temperature).toBe(5); expect(vm.status).toBe('NORMAL'); expect(vm.onlineNodes).toBe(0);
  });
  it('maps missing data to the existing unavailable presentation without inventing readings', () => {
    const dto = zoneFixture(); dto.environmentalCondition = 'NO_DATA'; dto.description = null; dto.lastUpdatedAt = null;
    dto.latestMeasurements = []; dto.sensors.forEach(node => node.lastMeasurementAt = null);
    const snapshot = zonesToMonitoringSnapshot([dto]); const vm = toMonitoringZoneViewModel(snapshot.zones[0], snapshot);
    expect(vm.status).toBe('OFFLINE'); expect(vm.temperature).toBeNull(); expect(vm.humidity).toBeNull();
    expect(vm.lastSeenAt).toBeUndefined(); expect(vm.offlineMinutes).toBeUndefined();
  });
});
