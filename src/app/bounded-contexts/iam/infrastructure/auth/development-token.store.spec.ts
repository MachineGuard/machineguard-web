import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../../../../core/config/api.config';
import { AuthContextService } from '../../application/services/auth-context.service';
import { ConfiguredAccessTokenProvider } from './configured-access-token.provider';
import { DevelopmentTokenStore } from './development-token.store';

describe('Temporary development token boundary', () => {
  afterEach(() => sessionStorage.removeItem(DevelopmentTokenStore.storageKey));
  it('reads a manually provided JWT in development, with IAM taking precedence', () => {
    TestBed.configureTestingModule({ providers: [{ provide: API_CONFIG, useValue: { baseUrl: '/api/v1', developmentTokenEnabled: true } }] });
    sessionStorage.setItem(DevelopmentTokenStore.storageKey, 'real-dev-jwt');
    const provider = TestBed.inject(ConfiguredAccessTokenProvider);
    expect(provider.getAccessToken()).toBe('real-dev-jwt');
    TestBed.inject(AuthContextService).setContext({ accessToken: 'iam-jwt' });
    expect(provider.getAccessToken()).toBe('iam-jwt');
  });
  it('ignores development storage when disabled for production', () => {
    TestBed.configureTestingModule({ providers: [{ provide: API_CONFIG, useValue: { baseUrl: '/api/v1', developmentTokenEnabled: false } }] });
    sessionStorage.setItem(DevelopmentTokenStore.storageKey, 'dev-jwt');
    expect(TestBed.inject(ConfiguredAccessTokenProvider).getAccessToken()).toBeNull();
  });
});
