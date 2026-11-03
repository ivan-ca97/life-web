/** Something the user tells the assistant once and reuses, by its label. */
export interface AiInstruction {
  id: string;
  assistant: "meals";
  label: string;
  text: string;
  /** Goes with every estimate without being chosen. */
  always_on: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAiInstructionRequest {
  label: string;
  text: string;
  always_on?: boolean;
}

export type UpdateAiInstructionRequest = Partial<CreateAiInstructionRequest> & { position?: number };
