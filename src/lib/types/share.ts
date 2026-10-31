export type ShareScope = "collection" | "item";
export type ShareAudience = "user" | "public";

export interface Share {
  id: string;
  owner_id: string;
  permission: string;
  scope: ShareScope;
  resource_id?: string;
  audience: ShareAudience;
  grantee_id?: string;
  created_at: string;
  /** Whether it grants anything now: only while the owner still holds the permission. */
  active: boolean;
}

export interface CreateShareRequest {
  permission: string;
  scope?: ShareScope;
  resource_id?: string;
  audience?: ShareAudience;
  grantee_id?: string;
}

export interface UpdateShareRequest {
  audience: ShareAudience;
  grantee_id?: string;
}
