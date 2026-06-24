export type ShareResourceType = "meals" | "exercises" | "weight" | "foods" | "goals" | "daily";

export interface Share {
  id: string;
  owner_id: string;
  grantee_id: string;
  resource_type: ShareResourceType;
  can_write: boolean;
  created_at: string;
}

export interface CreateShareRequest {
  grantee_email: string;
  resource_type: ShareResourceType;
  can_write: boolean;
}

export interface UpdateShareRequest {
  can_write: boolean;
}
