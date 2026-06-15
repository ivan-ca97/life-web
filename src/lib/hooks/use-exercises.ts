import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as exercisesApi from "@/lib/api/exercises";
import { useDebounce } from "@/hooks/use-debounce";
import type {
  CreateExerciseRequest,
  UpdateExerciseRequest,
} from "@/lib/types/exercise";

export function useExercises(params: {
  date?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["exercises", params],
    queryFn: () => exercisesApi.getExercises(params),
  });
}

export function useExercise(id: string) {
  return useQuery({
    queryKey: ["exercises", id],
    queryFn: () => exercisesApi.getExercise(id),
    enabled: !!id,
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExerciseRequest) =>
      exercisesApi.createExercise(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      queryClient.invalidateQueries({ queryKey: ["daily"] });
    },
  });
}

export function useUpdateExercise(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateExerciseRequest) =>
      exercisesApi.updateExercise(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      queryClient.invalidateQueries({ queryKey: ["daily"] });
    },
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => exercisesApi.deleteExercise(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      queryClient.invalidateQueries({ queryKey: ["daily"] });
    },
  });
}

export function useCalorieEstimate(steps: number) {
  const debounced = useDebounce(steps, 500);

  return useQuery({
    queryKey: ["calorie-estimate", "steps", debounced],
    queryFn: () => exercisesApi.estimateCalories({ type: "steps", value: debounced }),
    enabled: debounced > 0,
  });
}

export function useImportHevyCsv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => exercisesApi.importHevyCsv(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      queryClient.invalidateQueries({ queryKey: ["daily"] });
    },
  });
}
