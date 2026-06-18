import { apiFetch, userFetch } from "./client";
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
  return userFetch<Food>("/foods", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getFoods(params: {
  q?: string;
  tag?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}): Promise<FoodPage> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.tag) search.set("tag", params.tag);
  if (params.sort) search.set("sort", params.sort);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.offset) search.set("offset", String(params.offset));
  return userFetch<FoodPage>(`/foods?${search}`);
}

export function getFood(id: string): Promise<Food> {
  return userFetch<Food>(`/foods/${id}`);
}

export function updateFood(id: string, data: UpdateFoodRequest): Promise<Food> {
  return userFetch<Food>(`/foods/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteFood(id: string): Promise<void> {
  return userFetch<void>(`/foods/${id}`, { method: "DELETE" });
}

export function getFoodUnits(id: string): Promise<string[]> {
  return userFetch<string[]>(`/foods/${id}/units`);
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
  return userFetch<FoodFrequencyResponse>(`/foods/frequency?${search}`);
}

export function getIngredients(params: {
  q?: string;
}): Promise<IngredientsListResponse> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  return userFetch<IngredientsListResponse>(`/foods/ingredients?${search}`);
}

/** Global route — no userId prefix */
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
  return userFetch<IngredientFrequencyResponse>(`/foods/ingredients/frequency?${search}`);
}

/** Global route — browse public foods */
export function getCommunityFoods(params: {
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<FoodPage> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.offset) search.set("offset", String(params.offset));
  return apiFetch<FoodPage>(`/foods/community?${search}`);
}

/** Copy a food to the current user's collection */
export function copyFood(id: string): Promise<Food> {
  return userFetch<Food>(`/foods/${id}/copy`, { method: "POST" });
}
