import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as stepsApi from "@/lib/api/steps";

export function useSteps(from?: string, to?: string) {
  return useQuery({
    queryKey: ["steps", from, to],
    queryFn: () => stepsApi.getSteps({ from, to }),
    enabled: !!from || !!to,
  });
}

export function useStepsByDate(date: string) {
  return useQuery({
    queryKey: ["steps", date],
    queryFn: () => stepsApi.getStepsByDate(date),
    enabled: !!date,
  });
}

export function useUpsertSteps() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ date, steps, source }: { date: string; steps: number; source?: string }) =>
      stepsApi.upsertSteps(date, { steps, source }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["steps"] });
      qc.invalidateQueries({ queryKey: ["daily", "summary", variables.date] });
    },
  });
}

export function useDeleteSteps() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => stepsApi.deleteSteps(date),
    onSuccess: (_data, date) => {
      qc.invalidateQueries({ queryKey: ["steps"] });
      qc.invalidateQueries({ queryKey: ["daily", "summary", date] });
    },
  });
}
