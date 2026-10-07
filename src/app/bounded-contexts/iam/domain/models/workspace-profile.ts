export interface WorkspaceProfile {
  displayName: string;
  role: string;
  facilityName: string;
  warehouseName: string;
  preview: boolean;
}

export interface AuthContext {
  accessToken?: string;
  organizationId?: string;
  userId?: string;
}
