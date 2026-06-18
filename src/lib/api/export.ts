import { userFetch } from "./client";

export function exportData(): Promise<unknown> {
  return userFetch<unknown>("/export");
}
