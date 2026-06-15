import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as foodsApi from "@/lib/api/foods";
import type { CreateFoodRequest, UpdateFoodRequest } from "@/lib/types/food";

export function useFoods(params: {
  q?: string;
  tag?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["foods", params],
    queryFn: () => foodsApi.getFoods(params),
  });
}

export function useFood(id: string) {
  return useQuery({
    queryKey: ["foods", id],
    queryFn: () => foodsApi.getFood(id),
    enabled: !!id,
  });
}

export function useFoodFrequency(params: {
  from?: string;
  to?: string;
  tag?: string;
}) {
  return useQuery({
    queryKey: ["foods", "frequency", params],
    queryFn: () => foodsApi.getFoodFrequency(params),
  });
}

export function useCreateFood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFoodRequest) => foodsApi.createFood(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foods"] });
    },
  });
}

export function useUpdateFood(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateFoodRequest) => foodsApi.updateFood(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foods"] });
    },
  });
}

export function useDeleteFood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => foodsApi.deleteFood(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foods"] });
    },
  });
}

export function useUnits() {
  return useQuery({
    queryKey: ["foods", "units"],
    queryFn: () => foodsApi.getUnits(),
    staleTime: Infinity,
  });
}

export function useIngredients(q: string) {
  return useQuery({
    queryKey: ["foods", "ingredients", q],
    queryFn: () => foodsApi.getIngredients({ q }),
    enabled: q.length > 0,
  });
}

export function useIngredientFrequency(params: {
  from: string;
  to: string;
}) {
  return useQuery({
    queryKey: ["foods", "ingredients", "frequency", params],
    queryFn: () => foodsApi.getIngredientFrequency(params),
    enabled: !!params.from && !!params.to,
  });
}
