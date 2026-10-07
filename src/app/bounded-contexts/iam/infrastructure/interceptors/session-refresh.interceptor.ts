import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { SessionService } from '../../application/services/session.service';

/**
 * Renews an expired access token once and replays the request. Must be registered before the
 * JWT interceptor so the replay picks up the renewed token.
 */
export const sessionRefreshInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);
  return next(request).pipe(
    catchError((error: unknown) => {
      const expired = error instanceof HttpErrorResponse && error.status === 401;
      // Auth endpoints answer 401 for wrong credentials or a spent refresh token: nothing to renew.
      if (!expired || !session.isAuthenticated() || /\/auth\//.test(request.url)) return throwError(() => error);
      return session.refresh().pipe(
        catchError(() => {
          session.end();
          return throwError(() => error);
        }),
        switchMap(() => next(request)),
      );
    }),
  );
};
