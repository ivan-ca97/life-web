import { Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AgentMark } from "@/lib/hooks/use-agent-marks";

export function AgentBadge({ mark }: { mark: AgentMark }) {
  const names = mark.names.join(", ");
  const label = mark.kind === "created" ? `Cargada por ${names}` : `Completada por ${names}`;
  return (
    <Badge variant="secondary" className="text-xs gap-1 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" title={label}>
      <Bot className="size-3" />
      {label}
    </Badge>
  );
}
