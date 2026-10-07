import { StatusTone } from '../../../shared/components/status-badge/status-badge.component';
import { ExcursionSeverity, ExcursionStatus } from '../infrastructure/api/excursions-api.client';

export const EXCURSION_STATUS: Record<ExcursionStatus, { label: string; tone: StatusTone }> = {
  ONGOING: { label: 'En curso', tone: 'out-of-range' },
  CLOSED: { label: 'Cerrada', tone: 'normal' },
};

export const SEVERITY_LABELS: Record<ExcursionSeverity, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};
