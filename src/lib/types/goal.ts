export interface Goal {
  id: string;
  daily_calories?: number;
  daily_protein_grams?: number;
  daily_carbs_grams?: number;
  daily_fat_grams?: number;
  daily_fiber_grams?: number;
  daily_steps?: number;
  daily_exercise_minutes?: number;
  target_weight_kg?: number;
  started_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UpsertGoalRequest {
  daily_calories?: number;
  daily_protein_grams?: number;
  daily_carbs_grams?: number;
  daily_fat_grams?: number;
  daily_fiber_grams?: number;
  daily_steps?: number;
  daily_exercise_minutes?: number;
  target_weight_kg?: number;
  started_at?: string;
}
