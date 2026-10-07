import { HttpErrorResponse } from '@angular/common/http';

export type EnvironmentalVariable = 'TEMPERATURE' | 'HUMIDITY';

export const UNITS: Record<EnvironmentalVariable, string> = { TEMPERATURE: '°C', HUMIDITY: '%HR' };

/** One decimal for live readings, as the design system requires. */
export const formatValue = (value: number): string => value.toFixed(1);

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return seconds % 60 ? `${minutes} min ${seconds % 60} s` : `${minutes} min`;
  return minutes % 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${Math.floor(minutes / 60)} h`;
}

/** Translation key for a failed save; `conflictKey` explains the 409 of the specific form. */
export function saveErrorKey(error: unknown, conflictKey: string): string {
  const status = error instanceof HttpErrorResponse ? error.status : -1;
  if (status === 409) return conflictKey;
  if (status === 403) return 'save.forbidden';
  if (status === 404) return 'save.notFound';
  if (status === 400) return 'save.invalid';
  return 'save.generic';
}
