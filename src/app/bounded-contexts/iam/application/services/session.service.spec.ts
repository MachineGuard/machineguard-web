import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { API_CONFIG } from '../../../../core/config/api.config';
import { apiContextInterceptor } from '../../../../core/interceptors/api-context.interceptor';
import { ACCESS_TOKEN_PROVIDER } from '../ports/access-token.provider';
import { ConfiguredAccessTokenProvider } from '../../infrastructure/auth/configured-access-token.provider';
import { SessionStore } from '../../infrastructure/auth/session.store';
import { sessionRefreshInterceptor } from '../../infrastructure/interceptors/session-refresh.interceptor';
import { SessionService } from './session.service';

const BASE = 'http://localhost:8080/api/v1';
const ZONES = `${BASE}/environmental-monitoring/zones`;
const authentication = (token: string) => ({
  tokenType: 'Bearer', accessToken: `access-${token}`, expiresIn: 900, refreshToken: `refresh-${token}`,
  user: { id: 'user', organizationId: 'org', email: 'admin@example.com', fullName: 'Admin', role: 'ADMIN', status: 'ACTIVE' },
  organization: { id: 'org', name: 'Acme', subscriptionPlan: 'FREE' },
});

describe('IAM session', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let router: jasmine.SpyObj<Router>;
  const configure = () => {
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([sessionRefreshInterceptor, apiContextInterceptor])), provideHttpClientTesting(),
      { provide: API_CONFIG, useValue: { baseUrl: BASE, developmentTokenEnabled: false } },
      { provide: ACCESS_TOKEN_PROVIDER, useExisting: ConfiguredAccessTokenProvider },
      { provide: Router, useValue: router },
    ] });
    http = TestBed.inject(HttpClient); controller = TestBed.inject(HttpTestingController);
    return TestBed.inject(SessionService);
  };
  const signIn = (session: SessionService) => {
    session.login({ email: 'admin@example.com', password: 'secret' }).subscribe();
    controller.expectOne(`${BASE}/auth/login`).flush(authentication('1'));
  };
  beforeEach(() => sessionStorage.removeItem(SessionStore.storageKey));
  afterEach(() => { controller.verify(); sessionStorage.removeItem(SessionStore.storageKey); });

  it('signs in, authorizes API calls and keeps only the needed identity', () => {
    const session = configure();
    expect(session.isAuthenticated()).toBeFalse();
    session.login({ email: 'admin@example.com', password: 'secret' }).subscribe();
    const login = controller.expectOne(`${BASE}/auth/login`);
    expect(login.request.body).toEqual({ email: 'admin@example.com', password: 'secret' });
    expect(login.request.headers.has('Authorization')).toBeFalse();
    login.flush(authentication('1'));
    expect(session.session()?.organization).toEqual({ id: 'org', name: 'Acme' });
    expect(sessionStorage.getItem(SessionStore.storageKey)).not.toContain('secret');
    http.get(ZONES).subscribe();
    const zones = controller.expectOne(ZONES);
    expect(zones.request.headers.get('Authorization')).toBe('Bearer access-1');
    zones.flush([]);
  });

  it('restores the session after a reload', () => {
    signIn(configure());
    TestBed.resetTestingModule();
    const restored = configure();
    expect(restored.isAuthenticated()).toBeTrue();
    expect(restored.session()?.user.fullName).toBe('Admin');
  });

  it('leaves the user signed out when the credentials are rejected', () => {
    const session = configure();
    let status = 0;
    session.login({ email: 'admin@example.com', password: 'wrong' }).subscribe({ error: (e) => (status = e.status) });
    controller.expectOne(`${BASE}/auth/login`).flush({ message: 'Invalid email or password' }, { status: 401, statusText: 'Unauthorized' });
    expect(status).toBe(401);
    expect(session.isAuthenticated()).toBeFalse();
    controller.expectNone(`${BASE}/auth/refresh`);
  });

  it('renews an expired access token once for concurrent requests and replays them', () => {
    const session = configure();
    signIn(session);
    const results: unknown[] = [];
    http.get(ZONES).subscribe((body) => results.push(body));
    http.get(ZONES).subscribe((body) => results.push(body));
    controller.match(ZONES).forEach((request) => request.flush(null, { status: 401, statusText: 'Unauthorized' }));
    const refresh = controller.expectOne(`${BASE}/auth/refresh`);
    expect(refresh.request.body).toEqual({ refreshToken: 'refresh-1' });
    refresh.flush(authentication('2'));
    const replayed = controller.match(ZONES);
    expect(replayed.length).toBe(2);
    replayed.forEach((request) => {
      expect(request.request.headers.get('Authorization')).toBe('Bearer access-2');
      request.flush(['zone']);
    });
    expect(results).toEqual([['zone'], ['zone']]);
    expect(session.session()?.refreshToken).toBe('refresh-2');
  });

  it('ends the session and returns to login when the refresh token is rejected', () => {
    const session = configure();
    signIn(session);
    let status = 0;
    http.get(ZONES).subscribe({ error: (e) => (status = e.status) });
    controller.expectOne(ZONES).flush(null, { status: 401, statusText: 'Unauthorized' });
    controller.expectOne(`${BASE}/auth/refresh`).flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(status).toBe(401);
    expect(session.isAuthenticated()).toBeFalse();
    expect(sessionStorage.getItem(SessionStore.storageKey)).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('revokes the session on logout and signs out even if the API fails', () => {
    const session = configure();
    signIn(session);
    session.logout();
    const logout = controller.expectOne(`${BASE}/auth/logout`);
    expect(logout.request.body).toEqual({ refreshToken: 'refresh-1' });
    expect(logout.request.headers.get('Authorization')).toBe('Bearer access-1');
    logout.flush(null, { status: 500, statusText: 'Server Error' });
    expect(session.isAuthenticated()).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
