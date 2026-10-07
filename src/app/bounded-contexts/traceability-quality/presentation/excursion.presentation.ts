import { StatusTone } from '../../../shared/components/status-badge/status-badge.component';
import { ExcursionStatus } from '../infrastructure/api/excursions-api.client';

export const EXCURSION_TONE: Record<ExcursionStatus, StatusTone> = { ONGOING: 'out-of-range', CLOSED: 'normal' };
