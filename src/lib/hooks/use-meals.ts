import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as mealsApi from "@/lib/api/meals";
import type { MealFilters } from "@/lib/api/meals";
import type { CreateMealRequest, UpdateMealRequest, MealPreviewItem } from "@/lib/types/meal";
import { useDebounce } from "@/hooks/use-debounce";

export function useMeals(params: MealFilters) {
  return useQuery({
    queryKey: ["meals", params],
    queryFn: () => mealsApi.getMeals(params),
  });
}

export function useMeal(id: string) {
  return useQuery({
    queryKey: ["meals", id],
    queryFn: () => mealsApi.getMeal(id),
    enabled: !!id,
  });
}

export function useMealTypes(hour?: number) {
  return useQuery({
    queryKey: ["meals", "types", { hour }],
    queryFn: () => mealsApi.getMealTypes(hour),
  });
}

export function useCreateMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMealRequest) => mealsApi.createMeal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      queryClient.invalidateQueries({ queryKey: ["daily"] });
    },
  });
}

export function useUpdateMeal(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateMealRequest) => mealsApi.updateMeal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      queryClient.invalidateQueries({ queryKey: ["daily"] });
    },
  });
}

export function useDeleteMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mealsApi.deleteMeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      queryClient.invalidateQueries({ queryKey: ["daily"] });
    },
  });
}

export function useMealPreview(items: MealPreviewItem[]) {
  const debouncedItems = useDebounce(items, 500);

  return useQuery({
    queryKey: ["meals", "preview", debouncedItems],
    queryFn: () => mealsApi.previewMealMacros({ items: debouncedItems }),
    enabled: debouncedItems.length > 0,
  });
}
