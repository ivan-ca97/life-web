import { userFetch } from "./client";
import type { Agent } from "@/lib/types/agent";

export function listAgents(): Promise<{ items: Agent[] }> {
  return userFetch<{ items: Agent[] }>("/agents");
}
