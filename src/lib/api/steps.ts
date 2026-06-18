import { userFetch } from "./client";
import type { StepsEntry } from "@/lib/types/steps";

export function getSteps(params: { from?: string; to?: string } = {}): Promise<{ items: StepsEntry[] }> {
  const search = new URLSearchParams();
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  const qs = search.toString();
  return userFetch<{ items: StepsEntry[] }>(`/steps${qs ? `?${qs}` : ""}`);
}

export function getStepsByDate(date: string): Promise<StepsEntry> {
  return userFetch<StepsEntry>(`/steps/${date}`);
}

export function upsertSteps(date: string, data: { steps: number; source?: string }): Promise<StepsEntry> {
  return userFetch<StepsEntry>(`/steps/${date}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteSteps(date: string): Promise<void> {
  return userFetch<void>(`/steps/${date}`, { method: "DELETE" });
}
