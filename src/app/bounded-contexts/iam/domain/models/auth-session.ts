export type UserRole = 'ADMIN' | 'VIEWER';

export interface SessionUser {
  id: string;
  organizationId: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface SessionOrganization {
  id: string;
  name: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
  organization: SessionOrganization;
}

export interface Credentials {
  email: string;
  password: string;
}
