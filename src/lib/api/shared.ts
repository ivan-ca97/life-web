import { apiFetch } from "./client";
import type { MealPage } from "@/lib/types/meal";
import type { WeightPage } from "@/lib/types/weight";
import type { ExercisePage } from "@/lib/types/exercise";
import type { FoodPage } from "@/lib/types/food";
import type { Goal } from "@/lib/types/goal";

// Reads of another user's data. The API answers only what that user shared with
// the current one.

export function getOwnerMeals(ownerId: string, from: string, to: string): Promise<MealPage> {
  return apiFetch<MealPage>(`/users/${ownerId}/meals?from=${from}&to=${to}&limit=50`);
}

export function getOwnerWeight(ownerId: string, from: string, to: string): Promise<WeightPage> {
  return apiFetch<WeightPage>(`/users/${ownerId}/weight?from=${from}&to=${to}&limit=50`);
}

export function getOwnerExercises(ownerId: string): Promise<ExercisePage> {
  return apiFetch<ExercisePage>(`/users/${ownerId}/exercises?limit=20`);
}

export function getOwnerFoods(ownerId: string): Promise<FoodPage> {
  return apiFetch<FoodPage>(`/users/${ownerId}/foods?limit=100`);
}

export function getOwnerGoals(ownerId: string): Promise<Goal> {
  return apiFetch<Goal>(`/users/${ownerId}/goals`);
}
