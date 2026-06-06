import { userFetch } from "./client";
import type {
  WeightEntry,
  WeightPage,
  CreateWeightRequest,
  UpdateWeightRequest,
} from "@/lib/types/weight";

export function getWeightEntries(params: {
  from: string;
  to: string;
  limit?: number;
  offset?: number;
}): Promise<WeightPage> {
  const search = new URLSearchParams();
  search.set("from", params.from);
  search.set("to", params.to);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.offset) search.set("offset", String(params.offset));
  return userFetch<WeightPage>(`/weight?${search}`);
}

export function getWeightEntry(id: string): Promise<WeightEntry> {
  return userFetch<WeightEntry>(`/weight/${id}`);
}

export function createWeightEntry(data: CreateWeightRequest): Promise<WeightEntry> {
  return userFetch<WeightEntry>("/weight", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateWeightEntry(
  id: string,
  data: UpdateWeightRequest
): Promise<WeightEntry> {
  return userFetch<WeightEntry>(`/weight/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteWeightEntry(id: string): Promise<void> {
  return userFetch<void>(`/weight/${id}`, { method: "DELETE" });
}
