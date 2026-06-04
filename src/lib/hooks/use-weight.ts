import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as weightApi from "@/lib/api/weight";
import type { CreateWeightRequest, UpdateWeightRequest } from "@/lib/types/weight";

export function useWeightEntries(params: {
  from: string;
  to: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["weight", params],
    queryFn: () => weightApi.getWeightEntries(params),
    enabled: !!params.from && !!params.to,
  });
}

export function useWeightEntry(id: string) {
  return useQuery({
    queryKey: ["weight", id],
    queryFn: () => weightApi.getWeightEntry(id),
    enabled: !!id,
  });
}

export function useCreateWeightEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWeightRequest) => weightApi.createWeightEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight"] });
      queryClient.invalidateQueries({ queryKey: ["daily"] });
    },
  });
}

export function useUpdateWeightEntry(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateWeightRequest) => weightApi.updateWeightEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight"] });
      queryClient.invalidateQueries({ queryKey: ["daily"] });
    },
  });
}

export function useDeleteWeightEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => weightApi.deleteWeightEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight"] });
      queryClient.invalidateQueries({ queryKey: ["daily"] });
    },
  });
}
