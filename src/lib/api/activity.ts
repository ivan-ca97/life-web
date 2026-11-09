import { userFetch } from "./client";
import type { ResourceActors } from "@/lib/types/activity";

export function getResourceActors(resourceType: string, ids: string[]): Promise<{ items: ResourceActors[] }> {
  const params = new URLSearchParams({ resource_type: resourceType, ids: ids.join(",") });
  return userFetch<{ items: ResourceActors[] }>(`/activity/actors?${params}`);
}
