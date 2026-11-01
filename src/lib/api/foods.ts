import { apiFetch, userFetch } from "./client";
import type {
  Food,
  FoodPage,
  Portion,
  CreateFoodRequest,
  UpdateFoodRequest,
  PortionRequest,
  UpdatePortionRequest,
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

/** A path of the current user's foods, or of the owner's when the food is someone else's. */
function foodFetch<T>(ownerId: string | undefined, path: string, options?: RequestInit): Promise<T> {
  return ownerId ? apiFetch<T>(`/users/${ownerId}${path}`, options) : userFetch<T>(path, options);
}

export function getFood(id: string, ownerId?: string): Promise<Food> {
  return foodFetch<Food>(ownerId, `/foods/${id}`);
}

export function updateFood(id: string, data: UpdateFoodRequest, ownerId?: string): Promise<Food> {
  return foodFetch<Food>(ownerId, `/foods/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteFood(id: string): Promise<void> {
  return userFetch<void>(`/foods/${id}`, { method: "DELETE" });
}

export function addFoodPortion(foodId: string, data: PortionRequest, ownerId?: string): Promise<Portion> {
  return foodFetch<Portion>(ownerId, `/foods/${foodId}/portions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateFoodPortion(
  foodId: string,
  portionId: string,
  data: UpdatePortionRequest,
  ownerId?: string,
): Promise<Portion> {
  return foodFetch<Portion>(ownerId, `/foods/${foodId}/portions/${portionId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteFoodPortion(foodId: string, portionId: string, ownerId?: string): Promise<void> {
  return foodFetch<void>(ownerId, `/foods/${foodId}/portions/${portionId}`, { method: "DELETE" });
}

/** Foods the current user can use in meals: their own, and those shared with them or with everyone. */
export function getUsableFoods(params: { q?: string; limit?: number; offset?: number }): Promise<FoodPage> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.offset) search.set("offset", String(params.offset));
  return userFetch<FoodPage>(`/foods/usable?${search}`);
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
