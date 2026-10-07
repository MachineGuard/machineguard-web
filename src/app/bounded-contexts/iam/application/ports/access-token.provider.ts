import { InjectionToken } from '@angular/core';

/** IAM supplies a real JWT; presentation profiles never supply credentials. */
export interface AccessTokenProvider {
  getAccessToken(): string | null;
}
export const ACCESS_TOKEN_PROVIDER = new InjectionToken<AccessTokenProvider>('ACCESS_TOKEN_PROVIDER');
