import { userFetch } from "./client";
import type { Share, CreateShareRequest, UpdateShareRequest } from "@/lib/types/share";

export function createShare(data: CreateShareRequest): Promise<Share> {
  return userFetch<Share>("/shares", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function listOwnedShares(): Promise<{ items: Share[] }> {
  return userFetch<{ items: Share[] }>("/shares");
}

export function listReceivedShares(): Promise<{ items: Share[] }> {
  return userFetch<{ items: Share[] }>("/shares/received");
}

export function updateShare(id: string, data: UpdateShareRequest): Promise<Share> {
  return userFetch<Share>(`/shares/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteShare(id: string): Promise<void> {
  return userFetch<void>(`/shares/${id}`, { method: "DELETE" });
}
