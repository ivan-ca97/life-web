import type { PaginatedResponse } from "./api";

export type MeasurementType = "mass" | "volume" | "unit";

export interface FoodConversion {
  unit: string;
  base_equivalent: number;
  inverse: boolean;
  note?: string;
}

export interface FoodConversionRequest {
  unit: string;
  base_equivalent: number;
  inverse?: boolean;
  note?: string;
}

export interface Ingredient {
  id: string;
  name: string;
}

export interface Food {
  id: string;
  user_id: string;
  name: string;
  measurement_type: MeasurementType;
  base_quantity: number;
  base_unit: string;
  default_calories?: number;
  default_protein_grams?: number;
  default_carbs_grams?: number;
  default_fat_grams?: number;
  default_fiber_grams?: number;
  public: boolean;
  conversions: FoodConversion[];
  tags: string[];
  ingredients: Ingredient[];
  created_at: string;
  updated_at: string;
}

export type FoodPage = PaginatedResponse<Food>;

export interface CreateFoodRequest {
  name: string;
  measurement_type: MeasurementType;
  base_quantity?: number;
  base_unit: string;
  default_calories?: number;
  default_protein_grams?: number;
  default_carbs_grams?: number;
  default_fat_grams?: number;
  default_fiber_grams?: number;
  public?: boolean;
  conversions?: FoodConversionRequest[];
  tags?: string[];
  ingredients?: string[];
}

export type UpdateFoodRequest = Partial<CreateFoodRequest>;

export interface FoodFrequencyItem {
  food_id: string;
  food_name: string;
  count: number;
  last_date: string;
}

export interface FoodFrequencyResponse {
  items: FoodFrequencyItem[];
}

export interface IngredientsListResponse {
  items: Ingredient[];
}

export interface IngredientFrequencyItem {
  ingredient_id: string;
  ingredient_name: string;
  count: number;
  last_date: string;
}

export interface IngredientFrequencyResponse {
  items: IngredientFrequencyItem[];
}

export interface UnitsListResponse {
  mass: string[];
  volume: string[];
  unit: string[];
}
