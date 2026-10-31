import { userFetch } from "./client";
import type { PermissionDefinition } from "@/lib/types/permission";

/** What the current user's roles allow them to do; with shareable, only what they can share. */
export function getMyPermissions(shareable: boolean): Promise<{ items: PermissionDefinition[] }> {
  const query = shareable ? "?shareable=true" : "";
  return userFetch<{ items: PermissionDefinition[] }>(`/permissions${query}`);
}
