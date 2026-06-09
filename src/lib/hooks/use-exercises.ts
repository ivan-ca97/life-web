import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as exercisesApi from "@/lib/api/exercises";
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
