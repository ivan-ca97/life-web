export interface StepsEntry {
  date: string;
  steps: number;
  source: string;
  calories_burned?: number;
  updated_at: string;
}

export interface UpsertStepsRequest {
  steps: number;
  source?: string;
}
