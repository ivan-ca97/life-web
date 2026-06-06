import { userFetch } from "./client";
import type {
  DailySummary,
  DailySummaryRangeResponse,
  DailyCorrection,
  UpsertCorrectionRequest,
} from "@/lib/types/daily";

export function getDailySummary(date: string): Promise<DailySummary> {
  return userFetch<DailySummary>(`/daily/summary?date=${date}`);
}

export function getDailySummaryRange(from: string, to: string): Promise<DailySummaryRangeResponse> {
  return userFetch<DailySummaryRangeResponse>(`/daily/summary/range?from=${from}&to=${to}`);
}

export function getCorrection(date: string): Promise<DailyCorrection> {
  return userFetch<DailyCorrection>(`/daily/corrections?date=${date}`);
}

export function upsertCorrection(data: UpsertCorrectionRequest): Promise<DailyCorrection> {
  return userFetch<DailyCorrection>("/daily/corrections", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteCorrections(date: string): Promise<void> {
  return userFetch<void>(`/daily/corrections?date=${date}`, { method: "DELETE" });
}
