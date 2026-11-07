import { HttpErrorResponse } from '@angular/common/http';

/** datetime-local is interpreted in the user's timezone; never shorten the requested period. */
export function utcPeriod(from: string, to: string): { from: string; to: string } | null {
  if (!from || !to) return null;
  const start = new Date(from), end = new Date(to);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start >= end) return null;
  // Reject normalized calendar values and nonexistent local times (for example a DST gap).
  for (const [text, date] of [[from, start], [to, end]] as const) {
    const local = text.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (local && [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()]
      .some((value, index) => value !== Number(local[index + 1] ?? 0))) return null;
  }
  return { from: start.toISOString(), to: end.toISOString() };
}
export function traceabilityError(error: unknown): string {
  const status = error instanceof HttpErrorResponse ? error.status : 0;
  return ({ 400: 'trace.invalid', 401: 'trace.unauthorized', 403: 'trace.forbidden', 404: 'trace.notFound',
    409: 'trace.integrityError' } as Record<number, string>)[status] ?? 'trace.unavailable';
}
