import { apiFetch } from "./client";
import type {
  Exercise,
  ExercisePage,
  CreateExerciseRequest,
  UpdateExerciseRequest,
} from "@/lib/types/exercise";

export function createExercise(data: CreateExerciseRequest): Promise<Exercise> {
  return apiFetch<Exercise>("/exercises", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getExercises(params: {
  date?: string;
  limit?: number;
  offset?: number;
}): Promise<ExercisePage> {
  const search = new URLSearchParams();
  if (params.date) search.set("date", params.date);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.offset) search.set("offset", String(params.offset));
  return apiFetch<ExercisePage>(`/exercises?${search}`);
}

export function getExercise(id: string): Promise<Exercise> {
  return apiFetch<Exercise>(`/exercises/${id}`);
}

export function updateExercise(
  id: string,
  data: UpdateExerciseRequest
): Promise<Exercise> {
  return apiFetch<Exercise>(`/exercises/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteExercise(id: string): Promise<void> {
  return apiFetch<void>(`/exercises/${id}`, { method: "DELETE" });
}
