import { userFetch } from "./client";
import type { Goal, UpsertGoalRequest } from "@/lib/types/goal";

export function getGoals(): Promise<Goal> {
  return userFetch<Goal>("/goals");
}

export function upsertGoals(data: UpsertGoalRequest): Promise<Goal> {
  return userFetch<Goal>("/goals", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
