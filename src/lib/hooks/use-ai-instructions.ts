import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api/ai-instructions";
import type { CreateAiInstructionRequest, UpdateAiInstructionRequest } from "@/lib/types/ai-instruction";

const KEY = ["ai-instructions"];

export function useAiInstructions() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.listAiInstructions(),
  });
}

export function useCreateAiInstruction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAiInstructionRequest) => api.createAiInstruction(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateAiInstruction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAiInstructionRequest }) => api.updateAiInstruction(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAiInstruction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteAiInstruction(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
