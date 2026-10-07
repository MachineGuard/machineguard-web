import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MonitoringRepository } from '../../domain/repositories/monitoring.repository';
import { MonitoringSnapshot } from '../../domain/models/monitoring.models';

@Injectable()
export class MockMonitoringRepository implements MonitoringRepository {
  watchSnapshot(): Observable<MonitoringSnapshot> {
    const now = Date.now();
    const recordedAt = new Date(now - 12000).toISOString();
    const zones = [
      {
        id: 'cold-room-a',
        name: 'Cold Room A',
        description: 'Chilled Vaccine Depository',
        deviationStartedAt: new Date(now - 48 * 60000).toISOString(),
      },
      {
        id: 'dry-store',
        name: 'Dry Store',
        description: 'Ambient Consumables',
      },
      { id: 'zone-c', name: 'Zone C', description: 'Packaging & Assembly' },
      {
        id: 'loading-dock',
        name: 'Loading Dock',
        description: 'Staging Ramp Bay 02',
      },
    ];
    const names = [
      ['Shelf A', 'Shelf B'],
      ['Bay 1', 'Bay 2', 'Ceiling'],
      ['Station 04 Sensor', 'Station 05 Sensor'],
      ['Mesh node Gateway-09'],
    ];
    const points = zones.flatMap((zone, i) =>
      names[i].map((name, j) => ({
        id: `${zone.id}-point-${j}`,
        monitoringZoneId: zone.id,
        name,
      })),
    );
    const firstPoint = (id: string) =>
      points.find((p) => p.monitoringZoneId === id)!;
    const history = [
      [6.2, 6.5, 6.8, 7, 9.4],
      [23.5, 23.8, 23.7, 24, 24.1],
      [23, 24, 25, 25.7, 26.5],
    ];
    return of<MonitoringSnapshot>({
      zones,
      points,
      nodes: points.map((point, i) => ({
        id: `node-${i + 1}`,
        monitoringPointId: point.id,
        status:
          point.monitoringZoneId === 'loading-dock' ? 'OFFLINE' : 'ONLINE',
        lastSeenAt:
          point.monitoringZoneId === 'loading-dock'
            ? new Date(now - 18 * 60000).toISOString()
            : recordedAt,
      })),
      measurements: [11.2, 24, 27].flatMap((value, i) => [
        {
          id: `temp-${i}`,
          organizationId: 'demo-organization',
          monitoringZoneId: zones[i].id,
          monitoringPointId: firstPoint(zones[i].id).id,
          environmentalVariable: 'TEMPERATURE' as const,
          measuredValue: value,
          recordedAt,
        },
        {
          id: `humidity-${i}`,
          organizationId: 'demo-organization',
          monitoringZoneId: zones[i].id,
          monitoringPointId: firstPoint(zones[i].id).id,
          environmentalVariable: 'RELATIVE_HUMIDITY' as const,
          measuredValue: [58, 46, 71][i],
          recordedAt,
        },
        ...history[i].map((measuredValue, j) => ({
          id: `history-${i}-${j}`,
          organizationId: 'demo-organization',
          monitoringZoneId: zones[i].id,
          monitoringPointId: firstPoint(zones[i].id).id,
          environmentalVariable: 'TEMPERATURE' as const,
          measuredValue,
          recordedAt: new Date(now - (6 - j) * 60000).toISOString(),
        })),
      ]),
      thresholds: zones.flatMap((zone, i) => [
        {
          id: `temp-threshold-${i}`,
          monitoringZoneId: zone.id,
          environmentalVariable: 'TEMPERATURE' as const,
          safeRange: { min: [2, 15, 15, 15][i], max: [8, 28, 28, 28][i] },
        },
        {
          id: `humidity-threshold-${i}`,
          monitoringZoneId: zone.id,
          environmentalVariable: 'RELATIVE_HUMIDITY' as const,
          safeRange: { min: 30, max: 75 },
        },
      ]),
    });
  }
}
