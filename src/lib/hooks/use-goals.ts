import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as goalsApi from "@/lib/api/goals";
import type { UpsertGoalRequest } from "@/lib/types/goal";

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: () => goalsApi.getGoals(),
  });
}

export function useUpsertGoals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpsertGoalRequest) => goalsApi.upsertGoals(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["daily"] });
    },
  });
}
