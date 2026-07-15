import { apiFetch, userFetch } from "./client";
import type {
  EstimateMealRequest,
  EstimateMealResponse,
  AiMonthlyUsage,
  SelfLimitRequest,
  AiTier,
  AiTierListResponse,
  CreateTierRequest,
  UpdateTierRequest,
} from "@/lib/types/ai";

// --- Estimacion (owner-scoped: /users/{userId}/ai/...) ---

export function estimateMeal(data: EstimateMealRequest): Promise<EstimateMealResponse> {
  return userFetch<EstimateMealResponse>("/ai/meals/estimate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// --- Cuota del usuario (nivel autenticado: /ai/me/...) ---

export function getMyAiUsage(): Promise<AiMonthlyUsage> {
  return apiFetch<AiMonthlyUsage>("/ai/me/usage");
}

export function setAiSelfLimit(data: SelfLimitRequest): Promise<AiMonthlyUsage> {
  return apiFetch<AiMonthlyUsage>("/ai/me/self-limit", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// --- Admin de tiers (/ai/admin/...) ---

export function getAiTiers(): Promise<AiTierListResponse> {
  return apiFetch<AiTierListResponse>("/ai/admin/tiers");
}

export function createAiTier(data: CreateTierRequest): Promise<AiTier> {
  return apiFetch<AiTier>("/ai/admin/tiers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAiTier(tierId: string, data: UpdateTierRequest): Promise<AiTier> {
  return apiFetch<AiTier>(`/ai/admin/tiers/${tierId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function assignUserTier(userId: string, tierId: string): Promise<void> {
  return apiFetch<void>(`/ai/admin/users/${userId}/tier`, {
    method: "PUT",
    body: JSON.stringify({ tier_id: tierId }),
  });
}

export function getUserAiUsage(userId: string): Promise<AiMonthlyUsage> {
  return apiFetch<AiMonthlyUsage>(`/ai/admin/users/${userId}/usage`);
}
