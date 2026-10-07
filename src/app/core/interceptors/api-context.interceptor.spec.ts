import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
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
      provideHttpClient(withInterceptors([apiContextInterceptor])), provideHttpClientTesting(),
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
});
