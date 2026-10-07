import { WritableSignal } from '@angular/core';
import { Observable } from 'rxjs';

export type LoadState<T> = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: T };

/** Keeps the data on screen during a reload so saving a form does not flash a skeleton. */
export function loadInto<T>(target: WritableSignal<LoadState<T>>, source: Observable<T>): void {
  if (target().status !== 'ready') target.set({ status: 'loading' });
  source.subscribe({
    next: (data) => target.set({ status: 'ready', data }),
    error: () => target.set({ status: 'error' }),
  });
}
