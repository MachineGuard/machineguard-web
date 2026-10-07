import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { apiContextInterceptor } from './api-context.interceptor';
import { AuthContextService } from '../auth/auth-context.service';

describe('API context interceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiContextInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });
  afterEach(() => controller.verify());

  it('does not invent credentials in preview mode', () => {
    http.get('http://localhost:8080/api/v1/alerts').subscribe();
    const request = controller.expectOne('http://localhost:8080/api/v1/alerts');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    expect(request.request.headers.has('X-Organization-Id')).toBeFalse();
    request.flush([]);
  });

  it('attaches IAM context only to the configured API', () => {
    TestBed.inject(AuthContextService).setContext({
      accessToken: 'test-token',
      organizationId: 'org',
      userId: 'user',
    });
    http.get('http://localhost:8080/api/v1/alerts').subscribe();
    const request = controller.expectOne('http://localhost:8080/api/v1/alerts');
    expect(request.request.headers.get('Authorization')).toBe(
      'Bearer test-token',
    );
    expect(request.request.headers.get('X-Organization-Id')).toBe('org');
    expect(request.request.headers.get('X-User-Id')).toBe('user');
    request.flush([]);
    http.get('https://example.test/api/v1/alerts').subscribe();
    const external = controller.expectOne('https://example.test/api/v1/alerts');
    expect(external.request.headers.has('Authorization')).toBeFalse();
    external.flush([]);
  });
});
