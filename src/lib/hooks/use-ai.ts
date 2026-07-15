import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as aiApi from "@/lib/api/ai";
import type {
  EstimateMealRequest,
  CreateTierRequest,
  UpdateTierRequest,
} from "@/lib/types/ai";

// --- Estimacion ---

export function useEstimateMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EstimateMealRequest) => aiApi.estimateMeal(data),
    // Cada estimacion consume cuota -> refrescar el consumo.
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-usage", "me"] }),
  });
}

// --- Cuota del usuario ---

export function useMyAiUsage() {
  return useQuery({
    queryKey: ["ai-usage", "me"],
    queryFn: () => aiApi.getMyAiUsage(),
  });
}

export function useSetAiSelfLimit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (selfLimitUsd: number | null) =>
      aiApi.setAiSelfLimit({ self_limit_usd: selfLimitUsd }),
    onSuccess: (usage) => qc.setQueryData(["ai-usage", "me"], usage),
  });
}

// --- Admin: tiers ---

export function useAiTiers() {
  return useQuery({
    queryKey: ["ai-tiers"],
    queryFn: () => aiApi.getAiTiers(),
  });
}

export function useCreateAiTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTierRequest) => aiApi.createAiTier(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-tiers"] }),
  });
}

export function useUpdateAiTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tierId, data }: { tierId: string; data: UpdateTierRequest }) =>
      aiApi.updateAiTier(tierId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-tiers"] }),
  });
}

export function useAssignUserTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, tierId }: { userId: string; tierId: string }) =>
      aiApi.assignUserTier(userId, tierId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-user-usage"] }),
  });
}

export function useUserAiUsage(userId: string | undefined) {
  return useQuery({
    queryKey: ["ai-user-usage", userId],
    queryFn: () => aiApi.getUserAiUsage(userId as string),
    enabled: !!userId,
  });
}
