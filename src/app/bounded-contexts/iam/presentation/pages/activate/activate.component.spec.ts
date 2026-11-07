import { Location } from '@angular/common';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { API_CONFIG } from '../../../../../core/config/api.config';
import { apiContextInterceptor } from '../../../../../core/interceptors/api-context.interceptor';
import { ACCESS_TOKEN_PROVIDER } from '../../../application/ports/access-token.provider';
import { AuthContextService } from '../../../application/services/auth-context.service';
import { ConfiguredAccessTokenProvider } from '../../../infrastructure/auth/configured-access-token.provider';
import { ActivateComponent } from './activate.component';

describe('ActivateComponent', () => {
  const url = 'http://localhost:8080/api/v1/auth/invitations/accept';
  const password = 'Clave segura 2026';
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'activate', component: ActivateComponent }]),
        provideLocationMocks(),
        provideHttpClient(withXhr(), withInterceptors([apiContextInterceptor])),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://localhost:8080/api/v1', developmentTokenEnabled: false } },
        { provide: ACCESS_TOKEN_PROVIDER, useExisting: ConfiguredAccessTokenProvider },
      ],
    });
    // An expired session token must not reach the public activation call.
    TestBed.inject(AuthContextService).setContext({ accessToken: 'expired-token', organizationId: 'org', userId: 'user' });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  async function open(path = '/activate?token=invitation-token') {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl(path, ActivateComponent);
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    return { component, fixture: harness.fixture };
  }

  it('shows an unavailable state and no form when the link has no token', async () => {
    const { component, fixture } = await open('/activate');
    expect(component.tokenMissing()).toBeTrue();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('no incluye el código');
    http.expectNone(url);
  });

  it('removes the invitation from the address bar after reading it', async () => {
    await open();
    const location = TestBed.inject(Location);
    expect(location.path()).toBe('/activate');
    expect(location.path()).not.toContain('invitation-token');
  });

  it('sends the Core contract without Bearer, shows success and logs nothing', async () => {
    const logs = [spyOn(console, 'log'), spyOn(console, 'error'), spyOn(console, 'warn'), spyOn(console, 'info')];
    const { component, fixture } = await open();
    component.form.setValue({ password, confirmPassword: password });
    component.submit();

    const request = http.expectOne(url);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ token: 'invitation-token', password });
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({ message: 'Invitation accepted. You can now sign in.' }, { status: 201, statusText: 'Created' });
    fixture.detectChanges();

    expect(component.completed()).toBeTrue();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/login"]')).not.toBeNull();
    for (const log of logs) expect(log).not.toHaveBeenCalled();
  });

  it('applies Core password rules on the client and sends nothing when they fail', async () => {
    const { component } = await open();
    component.form.setValue({ password: 'short-pass', confirmPassword: 'short-pass' });
    component.submit();
    expect(component.passwordErrorKey()).toBe('activate.passwordShort');

    component.form.setValue({ password: 'ñ'.repeat(37), confirmPassword: 'ñ'.repeat(37) });
    component.submit();
    expect(component.passwordErrorKey()).toBe('activate.passwordLong');

    component.form.setValue({ password, confirmPassword: 'Otra clave 2026' });
    component.submit();
    expect(component.confirmErrorKey()).toBe('activate.confirmMismatch');
    http.expectNone(url);
  });

  it('shows the invalid-link state when Core rejects the invitation', async () => {
    const { component, fixture } = await open();
    component.form.setValue({ password, confirmPassword: password });
    component.submit();
    http.expectOne(url).flush({ status: 401, message: 'Invalid or expired invitation' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(component.tokenRejected()).toBeTrue();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('no es válido o ya venció');
  });

  it('keeps the typed passwords when Core rejects the password', async () => {
    const { component } = await open();
    component.form.setValue({ password, confirmPassword: password });
    component.submit();
    http.expectOne(url).flush({ status: 400, message: 'Password must contain at least 12 characters' }, { status: 400, statusText: 'Bad Request' });

    expect(component.error()).toBe('activate.error.password');
    expect(component.form.getRawValue()).toEqual({ password, confirmPassword: password });
  });

  it('keeps the text after a network failure and allows a retry', async () => {
    const { component } = await open();
    component.form.setValue({ password, confirmPassword: password });
    component.submit();
    http.expectOne(url).error(new ProgressEvent('error'));

    expect(component.error()).toBe('activate.error.connection');
    expect(component.form.getRawValue()).toEqual({ password, confirmPassword: password });

    component.submit();
    http.expectOne(url).flush({ message: 'ok' }, { status: 201, statusText: 'Created' });
    expect(component.completed()).toBeTrue();
  });

  it('sends one request while the first one is pending', async () => {
    const { component } = await open();
    component.form.setValue({ password, confirmPassword: password });
    component.submit();
    component.submit();
    const request = http.expectOne(url);
    request.flush({ message: 'ok' }, { status: 201, statusText: 'Created' });
  });
});
