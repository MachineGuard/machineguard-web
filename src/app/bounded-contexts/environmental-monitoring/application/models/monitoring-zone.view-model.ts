import { ZoneStatus } from '../../domain/models/monitoring.models';

export interface MonitoringZoneViewModel {
  id: string;
  name: string;
  description: string;
  temperature: number | null;
  humidity: number | null;
  status: ZoneStatus;
  minTemperature?: number;
  maxTemperature?: number;
  onlineNodes: number;
  offlineNodes: number;
  lastUpdated?: string;
  deviationNote?: string;
  /** Same deviation in a form the presentation layer can translate. */
  deviation?: { variable: 'TEMPERATURE' | 'HUMIDITY'; direction: 'above' | 'below'; limit: number };
  pointNames: string[];
  lastSeenAt?: string;
  offlineMinutes?: number;
  excursionMinutes?: number;
  temperatureTrend: {
    level: number;
    tone: 'normal' | 'near-limit' | 'out-of-range';
  }[];
}
