import { inject, DOCUMENT } from '@angular/core';

import { HttpInterceptorFn } from '@angular/common/http';
import { API_CONFIG } from '../config/api.config';
import { ACCESS_TOKEN_PROVIDER } from '../../bounded-contexts/iam/application/ports/access-token.provider';

export const apiContextInterceptor: HttpInterceptorFn = (request, next) => {
  const config = inject(API_CONFIG);
  const document = inject(DOCUMENT);
  const tokens = inject(ACCESS_TOKEN_PROVIDER);
  const base = new URL(config.baseUrl, document.baseURI);
  const target = new URL(request.url, document.baseURI);
  const basePath = base.pathname.replace(/\/$/, '');
  if (target.origin !== base.origin ||
      !(target.pathname === basePath || target.pathname.startsWith(`${basePath}/`))) {
    return next(request);
  }
  // Login, refresh and invitation acceptance authenticate with their body; an expired Bearer would reject them.
  if (request.method === 'POST' &&
      [ `${basePath}/auth/login`, `${basePath}/auth/refresh`, `${basePath}/auth/invitations/accept` ].includes(target.pathname)) {
    return next(request.clone({ headers: request.headers.delete('Authorization') }));
  }
  const token = tokens.getAccessToken();
  return next(token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request);
};
