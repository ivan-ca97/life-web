import { apiFetch } from "./client";
import type {
  DailySummary,
  DailyCorrection,
  UpsertCorrectionRequest,
} from "@/lib/types/daily";

export function getDailySummary(date: string): Promise<DailySummary> {
  return apiFetch<DailySummary>(`/daily/summary?date=${date}`);
}

export function getCorrection(date: string): Promise<DailyCorrection> {
  return apiFetch<DailyCorrection>(`/daily/corrections?date=${date}`);
}

export function upsertCorrection(data: UpsertCorrectionRequest): Promise<DailyCorrection> {
  return apiFetch<DailyCorrection>("/daily/corrections", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteCorrections(date: string): Promise<void> {
  return apiFetch<void>(`/daily/corrections?date=${date}`, { method: "DELETE" });
}
