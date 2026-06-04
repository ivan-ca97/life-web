import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as dailyApi from "@/lib/api/daily";
import type { UpsertCorrectionRequest } from "@/lib/types/daily";

export function useDailySummary(date: string) {
  return useQuery({
    queryKey: ["daily", "summary", date],
    queryFn: () => dailyApi.getDailySummary(date),
    enabled: !!date,
  });
}

export function useCorrection(date: string) {
  return useQuery({
    queryKey: ["daily", "corrections", date],
    queryFn: () => dailyApi.getCorrection(date),
    enabled: !!date,
  });
}

export function useUpsertCorrection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpsertCorrectionRequest) => dailyApi.upsertCorrection(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["daily", "corrections", variables.date] });
      queryClient.invalidateQueries({ queryKey: ["daily", "summary", variables.date] });
    },
  });
}

export function useDeleteCorrections(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => dailyApi.deleteCorrections(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily", "corrections", date] });
      queryClient.invalidateQueries({ queryKey: ["daily", "summary", date] });
    },
  });
}
