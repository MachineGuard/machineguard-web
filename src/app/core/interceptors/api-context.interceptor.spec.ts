import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { apiContextInterceptor } from './api-context.interceptor';
import { AuthContextService } from '../auth/auth-context.service';
import { API_CONFIG } from '../config/api.config';
import { ACCESS_TOKEN_PROVIDER } from '../../bounded-contexts/iam/application/ports/access-token.provider';
import { ConfiguredAccessTokenProvider } from '../../bounded-contexts/iam/infrastructure/auth/configured-access-token.provider';

describe('API JWT interceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withXhr(), withInterceptors([apiContextInterceptor])), provideHttpClientTesting(),
      { provide: API_CONFIG, useValue: { baseUrl: 'http://localhost:8080/api/v1', developmentTokenEnabled: false } },
      { provide: ACCESS_TOKEN_PROVIDER, useExisting: ConfiguredAccessTokenProvider },
    ] });
    http = TestBed.inject(HttpClient); controller = TestBed.inject(HttpTestingController);
  });
  afterEach(() => controller.verify());
  it('does not invent credentials when no token exists', () => {
    http.get('http://localhost:8080/api/v1/environmental-monitoring/zones').subscribe();
    const request = controller.expectOne('http://localhost:8080/api/v1/environmental-monitoring/zones');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    expect(request.request.headers.has('X-Organization-Id')).toBeFalse();
    expect(request.request.headers.has('X-User-Id')).toBeFalse();
    request.flush([]);
  });
  it('sends only Bearer JWT to the configured backend', () => {
    TestBed.inject(AuthContextService).setContext({ accessToken: 'test-token', organizationId: 'org', userId: 'user' });
    http.get('http://localhost:8080/api/v1/environmental-monitoring/zones').subscribe();
    const request = controller.expectOne('http://localhost:8080/api/v1/environmental-monitoring/zones');
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    expect(request.request.headers.has('X-Organization-Id')).toBeFalse();
    expect(request.request.headers.has('X-User-Id')).toBeFalse();
    request.flush([]);
    for (const url of ['https://example.test/api/v1/zones', 'http://localhost:8080/api/v10/zones', 'http://localhost:8080/api/v1-other']) {
      http.get(url).subscribe();
      const external = controller.expectOne(url);
      expect(external.request.headers.has('Authorization')).toBeFalse(); external.flush([]);
    }
  });

  it('omits Bearer only for exact body-authenticated POSTs and protects validate/logout', () => {
    TestBed.inject(AuthContextService).setContext({ accessToken: 'expired-token', organizationId: 'org', userId: 'user' });
    const base = 'http://localhost:8080/api/v1';
    for (const path of ['auth/login', 'auth/refresh']) {
      http.post(`${base}/${path}?source=test`, {}, { headers: { Authorization: 'Bearer expired-token' } }).subscribe();
      const request = controller.expectOne(`${base}/${path}?source=test`);
      expect(request.request.headers.has('Authorization')).toBeFalse();
      request.flush({});
    }
    for (const path of ['auth/validate', 'auth/logout', 'auth/refresh-extra', 'auth/refresh/']) {
      http.post(`${base}/${path}`, {}).subscribe();
      const request = controller.expectOne(`${base}/${path}`);
      expect(request.request.headers.get('Authorization')).toBe('Bearer expired-token');
      request.flush({});
    }
    http.get(`${base}/auth/refresh`).subscribe();
    const get = controller.expectOne(`${base}/auth/refresh`);
    expect(get.request.headers.get('Authorization')).toBe('Bearer expired-token');
    get.flush({});
  });

  it('omits Bearer only for the exact invitation acceptance POST', () => {
    TestBed.inject(AuthContextService).setContext({ accessToken: 'expired-token', organizationId: 'org', userId: 'user' });
    const base = 'http://localhost:8080/api/v1';
    const accept = `${base}/auth/invitations/accept`;
    http.post(accept, { token: 'invitation-token', password: 'password-of-12' }).subscribe();
    const request = controller.expectOne(accept);
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({ message: 'ok' });
    for (const [method, url] of [
      ['POST', `${base}/auth/invitations/accept/`],
      ['POST', `${base}/auth/invitations/accept-extra`],
      ['POST', `${base}/auth/invitations`],
      ['GET', accept],
    ] as const) {
      http.request(method, url, { body: {} }).subscribe();
      const protectedRequest = controller.expectOne(url);
      expect(protectedRequest.request.headers.get('Authorization')).withContext(`${method} ${url}`).toBe('Bearer expired-token');
      protectedRequest.flush({});
    }
  });
});
