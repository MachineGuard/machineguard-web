import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { API_CONFIG } from '../config/api.config';
import { AuthContextService } from '../auth/auth-context.service';

export const apiContextInterceptor: HttpInterceptorFn = (request, next) => {
  const baseUrl = inject(API_CONFIG).baseUrl.replace(/\/$/, '');
  const context = inject(AuthContextService).context();
  if (
    !context ||
    !(request.url === baseUrl || request.url.startsWith(`${baseUrl}/`))
  ) {
    return next(request);
  }
  const headers: Record<string, string> = {};
  if (context.accessToken)
    headers['Authorization'] = `Bearer ${context.accessToken}`;
  if (context.organizationId)
    headers['X-Organization-Id'] = context.organizationId;
  if (context.userId) headers['X-User-Id'] = context.userId;
  return next(request.clone({ setHeaders: headers }));
};
