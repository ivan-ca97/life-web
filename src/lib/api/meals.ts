import { userFetch } from "./client";
import type {
  Meal,
  MealPage,
  CreateMealRequest,
  UpdateMealRequest,
  MealTypesResponse,
  MealPreviewRequest,
  MealPreviewResponse,
} from "@/lib/types/meal";

export function createMeal(data: CreateMealRequest): Promise<Meal> {
  return userFetch<Meal>("/meals", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getMeals(params: {
  date?: string;
  limit?: number;
  offset?: number;
}): Promise<MealPage> {
  const search = new URLSearchParams();
  if (params.date) search.set("date", params.date);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.offset) search.set("offset", String(params.offset));
  return userFetch<MealPage>(`/meals?${search}`);
}

export function getMeal(id: string): Promise<Meal> {
  return userFetch<Meal>(`/meals/${id}`);
}

export function updateMeal(id: string, data: UpdateMealRequest): Promise<Meal> {
  return userFetch<Meal>(`/meals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteMeal(id: string): Promise<void> {
  return userFetch<void>(`/meals/${id}`, { method: "DELETE" });
}

export function getMealTypes(hour?: number): Promise<MealTypesResponse> {
  const search = hour !== undefined ? `?hour=${hour}` : "";
  return userFetch<MealTypesResponse>(`/meals/types${search}`);
}

export function previewMealMacros(data: MealPreviewRequest): Promise<MealPreviewResponse> {
  return userFetch<MealPreviewResponse>("/meals/preview", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
