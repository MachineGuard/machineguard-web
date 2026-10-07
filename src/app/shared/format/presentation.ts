import { HttpErrorResponse } from '@angular/common/http';

export type EnvironmentalVariable = 'TEMPERATURE' | 'HUMIDITY';

export const VARIABLES: Record<EnvironmentalVariable, { label: string; unit: string }> = {
  TEMPERATURE: { label: 'Temperatura', unit: '°C' },
  HUMIDITY: { label: 'Humedad relativa', unit: '%HR' },
};

const dateTime = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
const time = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

export const formatDateTime = (iso: string): string => dateTime.format(new Date(iso)).replace(',', '');
export const formatTime = (iso: string): string => time.format(new Date(iso));
/** One decimal for live readings, as the design system requires. */
export const formatValue = (value: number): string => value.toFixed(1);

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return seconds % 60 ? `${minutes} min ${seconds % 60} s` : `${minutes} min`;
  return minutes % 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${Math.floor(minutes / 60)} h`;
}

export function formatElapsed(iso: string | null): string {
  if (!iso) return 'Aún sin mediciones';
  const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000));
  if (seconds < 60) return 'Hace menos de un minuto';
  if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} h`;
  return `Hace ${Math.floor(seconds / 86400)} d`;
}

/** Message for a failed save; `conflict` explains the 409 of the specific form. */
export function saveErrorMessage(error: unknown, conflict: string): string {
  const status = error instanceof HttpErrorResponse ? error.status : -1;
  if (status === 409) return conflict;
  if (status === 403) return 'Tu rol no permite esta acción.';
  if (status === 404) return 'El elemento ya no existe. Recarga la página.';
  if (status === 400) return 'Revisa los datos ingresados.';
  return 'No se pudo guardar. Inténtalo de nuevo en unos segundos.';
}
