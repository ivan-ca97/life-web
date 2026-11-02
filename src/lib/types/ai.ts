import type { MeasurementType } from "./food";

export type AiConfidence = "low" | "medium" | "high";

// --- Estimacion de comida ---

export interface AiEstimateCorrection {
  item: string;
  correction: string;
}

export interface EstimateMealRequest {
  photo_urls?: string[];
  instructions?: string;
  assume_only_visible?: boolean;
  corrections?: AiEstimateCorrection[];
}

export interface AiSuggestedCorrection {
  calories?: number;
  protein_grams?: number;
  carbs_grams?: number;
  fat_grams?: number;
  fiber_grams?: number;
  reason: string;
}

export interface AiMatchedItem {
  food_id: string;
  food_name: string;
  estimated_quantity: number;
  unit: string;
  confidence: AiConfidence;
  assumption: string;
  sanity_warnings: string[];
  suggested_correction?: AiSuggestedCorrection;
}

export interface AiNewFoodCreateParams {
  measurement_type: MeasurementType;
  base_unit: string;
  base_quantity: number;
  default_calories?: number | null;
  default_protein_grams?: number | null;
  default_carbs_grams?: number | null;
  default_fat_grams?: number | null;
  default_fiber_grams?: number | null;
  /** Named portions, such as the serving a nutrition label declares, in the base unit. */
  portions?: { name: string; base_equivalent: number }[];
}

export interface AiNewFoodSuggestion {
  name: string;
  estimated_quantity: number;
  unit: string;
  confidence: AiConfidence;
  assumption: string;
  create_params: AiNewFoodCreateParams;
}

export interface AiTotals {
  calories: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
  fiber_grams: number;
}

export interface AiUsageInfo {
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
}

export interface EstimateMealResponse {
  matched_items: AiMatchedItem[];
  new_food_suggestions: AiNewFoodSuggestion[];
  totals: AiTotals;
  assumptions: string[];
  no_food_detected: boolean;
  needs_clarification: boolean;
  clarification_question?: string;
  usage: AiUsageInfo;
}

// --- Cuota / consumo ---

export interface AiMonthlyUsage {
  period_start: string;
  requests: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  effective_limit_usd: number | null;
  tier_name: string;
}

export interface SelfLimitRequest {
  self_limit_usd: number | null;
}

// --- Admin: tiers ---

export interface AiTier {
  id: string;
  name: string;
  monthly_limit_usd: number | null;
  is_default: boolean;
  enabled: boolean;
}

export interface AiTierListResponse {
  items: AiTier[];
}

export interface CreateTierRequest {
  name: string;
  monthly_limit_usd: number | null;
  enabled?: boolean;
}

export interface UpdateTierRequest {
  name?: string;
  monthly_limit_usd?: number | null;
  enabled?: boolean;
  unlimited?: boolean;
}

export interface AssignTierRequest {
  tier_id: string;
}
