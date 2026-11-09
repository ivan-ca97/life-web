import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listAgents } from "@/lib/api/agents";
import { getResourceActors } from "@/lib/api/activity";

// What an AI agent did to a resource: created it, or changed what the user created.
export interface AgentMark {
  kind: "created" | "edited";
  names: string[];
}

// An agent's username is its name made a slug plus part of its id: "claude-62d1d9b1".
export function agentDisplayName(username: string): string {
  const name = username.replace(/-[0-9a-f]{8}$/, "").replace(/-/g, " ");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: listAgents,
    staleTime: 5 * 60 * 1000,
  });
}

// The marks of the resources an agent touched, by resource id. Under the
// resource's own query key, so that changing one refreshes its marks.
export function useAgentMarks(queryRoot: string, resourceType: string, ids: string[]) {
  const { data: agents } = useAgents();
  const hasAgents = (agents?.items.length ?? 0) > 0;
  const { data: actors } = useQuery({
    queryKey: [queryRoot, "actors", ids],
    queryFn: () => getResourceActors(resourceType, ids),
    enabled: hasAgents && ids.length > 0,
  });

  return useMemo(() => {
    const marks = new Map<string, AgentMark>();
    if (!agents || !actors) return marks;
    const names = new Map(agents.items.map((a) => [a.id, agentDisplayName(a.username)]));
    for (const resource of actors.items) {
      const creator = resource.creator_id ? names.get(resource.creator_id) : undefined;
      if (creator) {
        marks.set(resource.resource_id, { kind: "created", names: [creator] });
        continue;
      }
      const editors = resource.editor_ids.map((id) => names.get(id)).filter((n): n is string => !!n);
      if (editors.length > 0) {
        marks.set(resource.resource_id, { kind: "edited", names: editors });
      }
    }
    return marks;
  }, [agents, actors]);
}
