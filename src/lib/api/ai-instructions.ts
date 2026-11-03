import { userFetch } from "./client";
import type {
  AiInstruction,
  CreateAiInstructionRequest,
  UpdateAiInstructionRequest,
} from "@/lib/types/ai-instruction";

export function listAiInstructions(): Promise<{ items: AiInstruction[] }> {
  return userFetch<{ items: AiInstruction[] }>("/ai/instructions?assistant=meals");
}

export function createAiInstruction(data: CreateAiInstructionRequest): Promise<AiInstruction> {
  return userFetch<AiInstruction>("/ai/instructions", {
    method: "POST",
    body: JSON.stringify({ ...data, assistant: "meals" }),
  });
}

export function updateAiInstruction(id: string, data: UpdateAiInstructionRequest): Promise<AiInstruction> {
  return userFetch<AiInstruction>(`/ai/instructions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteAiInstruction(id: string): Promise<void> {
  return userFetch<void>(`/ai/instructions/${id}`, { method: "DELETE" });
}
