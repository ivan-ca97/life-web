// Who created a resource and who changed it after. creator_id is null for
// resources created before their history began.
export interface ResourceActors {
  resource_id: string;
  creator_id: string | null;
  editor_ids: string[];
}
