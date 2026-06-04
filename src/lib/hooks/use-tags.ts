import { useQuery } from "@tanstack/react-query";
import * as mealsApi from "@/lib/api/meals";
import * as exercisesApi from "@/lib/api/exercises";
import * as foodsApi from "@/lib/api/foods";

function extractTags(items: Array<{ tags: string[] }>): string[] {
  const set = new Set<string>();
  for (const item of items) {
    for (const tag of item.tags) set.add(tag);
  }
  return Array.from(set).sort();
}

export function useMealTags() {
  return useQuery({
    queryKey: ["meals", "all-tags"],
    queryFn: async () => {
      const data = await mealsApi.getMeals({ limit: 200 });
      return extractTags(data.items);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useExerciseTags() {
  return useQuery({
    queryKey: ["exercises", "all-tags"],
    queryFn: async () => {
      const data = await exercisesApi.getExercises({ limit: 200 });
      return extractTags(data.items);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useFoodTags() {
  return useQuery({
    queryKey: ["foods", "all-tags"],
    queryFn: async () => {
      const data = await foodsApi.getFoods({ limit: 200 });
      return extractTags(data.items);
    },
    staleTime: 5 * 60 * 1000,
  });
}
