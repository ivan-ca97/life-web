import { apiFetch } from "./client";
import type { Goal, UpsertGoalRequest } from "@/lib/types/goal";

export function getGoals(): Promise<Goal> {
  return apiFetch<Goal>("/goals");
}

export function upsertGoals(data: UpsertGoalRequest): Promise<Goal> {
  return apiFetch<Goal>("/goals", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
