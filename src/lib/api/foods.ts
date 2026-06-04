import { apiFetch } from "./client";
import type {
  Food,
  FoodPage,
  CreateFoodRequest,
  UpdateFoodRequest,
  FoodFrequencyResponse,
  IngredientsListResponse,
  IngredientFrequencyResponse,
  UnitsListResponse,
} from "@/lib/types/food";

export function createFood(data: CreateFoodRequest): Promise<Food> {
  return apiFetch<Food>("/foods", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getFoods(params: {
  q?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}): Promise<FoodPage> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.tag) search.set("tag", params.tag);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.offset) search.set("offset", String(params.offset));
  return apiFetch<FoodPage>(`/foods?${search}`);
}

export function getFood(id: string): Promise<Food> {
  return apiFetch<Food>(`/foods/${id}`);
}

export function updateFood(id: string, data: UpdateFoodRequest): Promise<Food> {
  return apiFetch<Food>(`/foods/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteFood(id: string): Promise<void> {
  return apiFetch<void>(`/foods/${id}`, { method: "DELETE" });
}

export function getFoodFrequency(params: {
  from?: string;
  to?: string;
  tag?: string;
}): Promise<FoodFrequencyResponse> {
  const search = new URLSearchParams();
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.tag) search.set("tag", params.tag);
  return apiFetch<FoodFrequencyResponse>(`/foods/frequency?${search}`);
}

export function getIngredients(params: {
  q?: string;
}): Promise<IngredientsListResponse> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  return apiFetch<IngredientsListResponse>(`/foods/ingredients?${search}`);
}

export function getUnits(): Promise<UnitsListResponse> {
  return apiFetch<UnitsListResponse>("/foods/units");
}

export function getIngredientFrequency(params: {
  from: string;
  to: string;
}): Promise<IngredientFrequencyResponse> {
  const search = new URLSearchParams();
  search.set("from", params.from);
  search.set("to", params.to);
  return apiFetch<IngredientFrequencyResponse>(`/foods/ingredients/frequency?${search}`);
}
