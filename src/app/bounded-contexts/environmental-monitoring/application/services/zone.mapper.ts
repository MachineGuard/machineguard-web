import {
  Measurement,
  MonitoringSnapshot,
  MonitoringZone,
  Threshold,
  ZoneStatus,
} from '../../domain/models/monitoring.models';
import { MonitoringZoneViewModel } from '../models/monitoring-zone.view-model';

function measurementStatus(value: number, threshold: Threshold): ZoneStatus {
  const { min, max } = threshold.safeRange;
  if (value < min || value > max) return 'OUT_OF_RANGE';
  const margin = (max - min) * 0.1;
  return value <= min + margin || value >= max - margin
    ? 'NEAR_LIMIT'
    : 'NORMAL';
}

/** Read projection: Core supplies zone state; mocks derive state from online points and thresholds. */
export function toMonitoringZoneViewModel(
  zone: MonitoringZone,
  snapshot: MonitoringSnapshot,
): MonitoringZoneViewModel {
  const pointIds = new Set(
    snapshot.points
      .filter((p) => p.monitoringZoneId === zone.id)
      .map((p) => p.id),
  );
  const nodes = snapshot.nodes.filter((n) => pointIds.has(n.monitoringPointId));
  const online = nodes.filter((n) => n.status === 'ONLINE');
  const onlinePointIds = new Set(online.map((n) => n.monitoringPointId));
  const measurements = snapshot.measurements
    .filter(
      (m) =>
        m.monitoringZoneId === zone.id &&
        (zone.reportedStatus
          ? zone.reportedStatus !== 'OFFLINE'
          : onlinePointIds.has(m.monitoringPointId)),
    )
    .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt));
  const temperature = measurements.find(
    (m) => m.environmentalVariable === 'TEMPERATURE',
  );
  const humidity = measurements.find(
    (m) => m.environmentalVariable === 'RELATIVE_HUMIDITY',
  );
  const thresholds = snapshot.thresholds.filter(
    (t) => t.monitoringZoneId === zone.id,
  );
  const temperatureRange = thresholds.find(
    (t) => t.environmentalVariable === 'TEMPERATURE',
  )?.safeRange;
  const candidates = zone.reportedStatus ? measurements : [temperature, humidity];
  const deviation = candidates.find((m) => {
    if (!m) return false;
    const threshold = thresholds.find(
      (t) => t.environmentalVariable === m.environmentalVariable,
    );
    return (
      threshold &&
      measurementStatus(m.measuredValue, threshold) === 'OUT_OF_RANGE'
    );
  });
  const deviationThreshold = thresholds.find(
    (t) => t.environmentalVariable === deviation?.environmentalVariable,
  );
  let deviationNote: string | undefined;
  let deviationDetail: MonitoringZoneViewModel['deviation'];
  if (deviation && deviationThreshold) {
    const { min, max } = deviationThreshold.safeRange;
    const label =
      deviation.environmentalVariable === 'TEMPERATURE'
        ? 'Temperature'
        : 'Humidity';
    const unit = deviation.environmentalVariable === 'TEMPERATURE' ? '°C' : '%';
    deviationNote =
      deviation.measuredValue > max
        ? `${label} exceeds ${max}${unit} limit`
        : `${label} below ${min}${unit} limit`;
    const above = deviation.measuredValue > max;
    deviationDetail = {
      variable: deviation.environmentalVariable === 'TEMPERATURE' ? 'TEMPERATURE' : 'HUMIDITY',
      direction: above ? 'above' : 'below',
      limit: above ? max : min,
    };
  }
  const statuses = [temperature, humidity]
    .filter((m): m is Measurement => !!m)
    .map((m) => {
      const threshold = thresholds.find(
        (t) => t.environmentalVariable === m.environmentalVariable,
      );
      return threshold
        ? measurementStatus(m.measuredValue, threshold)
        : 'NORMAL';
    });
  const status: ZoneStatus = zone.reportedStatus ?? (
    !online.length
      ? 'OFFLINE'
      : statuses.includes('OUT_OF_RANGE')
        ? 'OUT_OF_RANGE'
        : statuses.includes('NEAR_LIMIT')
          ? 'NEAR_LIMIT'
          : 'NORMAL'
  );
  const lastSeenTimes = nodes
    .map(node => node.lastSeenAt)
    .filter((time): time is string => !!time)
    .sort((a, b) => Date.parse(b) - Date.parse(a));
  return {
    ...zone,
    temperature: temperature?.measuredValue ?? null,
    humidity: humidity?.measuredValue ?? null,
    status,
    minTemperature: temperatureRange?.min,
    maxTemperature: temperatureRange?.max,
    onlineNodes: zone.sensorCounts?.online ?? online.length,
    offlineNodes: zone.sensorCounts?.offline ??
      nodes.filter(node => node.status === 'OFFLINE').length,
    lastUpdated: zone.lastUpdatedAt ?? measurements[0]?.recordedAt,
    deviationNote,
    deviation: deviationDetail,
    pointNames: snapshot.points
      .filter((p) => pointIds.has(p.id))
      .map((p) => p.name),
    lastSeenAt: lastSeenTimes[0],
    offlineMinutes:
      !online.length && lastSeenTimes.length
        ? Math.max(
            0,
            Math.floor(
              (Date.now() - Date.parse(lastSeenTimes[0])) / 60000,
            ),
          )
        : undefined,
    excursionMinutes:
      status === 'OUT_OF_RANGE' && zone.deviationStartedAt
        ? Math.max(
            0,
            Math.floor(
              (Date.now() - Date.parse(zone.deviationStartedAt)) / 60000,
            ),
          )
        : undefined,
    temperatureTrend: measurements
      .filter((m) => m.environmentalVariable === 'TEMPERATURE')
      .slice(0, zone.reportedStatus ? 1 : 6)
      .reverse()
      .map((m) => {
        const threshold = thresholds.find(
          (t) => t.environmentalVariable === 'TEMPERATURE',
        );
        const readingStatus = threshold
          ? measurementStatus(m.measuredValue, threshold)
          : 'NORMAL';
        const range = threshold?.safeRange;
        return {
          level: range
            ? Math.max(
                1,
                Math.min(
                  8,
                  Math.round(
                    1 +
                      ((m.measuredValue - range.min) /
                        (range.max - range.min)) *
                        6,
                  ),
                ),
              )
            : 4,
          tone:
            readingStatus === 'OUT_OF_RANGE'
              ? 'out-of-range'
              : readingStatus === 'NEAR_LIMIT'
                ? 'near-limit'
                : 'normal',
        };
      }),
  };
}
