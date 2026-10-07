import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { LOGIN_PATH, SessionService } from '../../application/services/session.service';

/** The mock profile has no Core API behind it, so it runs without a session. */
const authenticationRequired = environment.monitoringSource !== 'mock';

export const authGuard: CanActivateFn = (_route, state) => {
  if (!authenticationRequired || inject(SessionService).isAuthenticated()) return true;
  return inject(Router).createUrlTree([LOGIN_PATH], {
    queryParams: state.url && state.url !== '/' ? { returnUrl: state.url } : {},
  });
};

export const guestGuard: CanActivateFn = () =>
  authenticationRequired && !inject(SessionService).isAuthenticated()
    ? true
    : inject(Router).createUrlTree(['/dashboard']);
