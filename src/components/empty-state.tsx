import Link from "next/link";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateAction =
  | { label: string; href: string; onClick?: never }
  | { label: string; onClick: () => void; href?: never };

interface EmptyStateProps {
  message: string;
  action?: EmptyStateAction;
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Inbox className="size-12 text-muted-foreground/50 mb-4" />
      <p className="text-muted-foreground mb-4">{message}</p>
      {action && action.href ? (
        <Button render={<Link href={action.href} />}>{action.label}</Button>
      ) : action ? (
        <Button onClick={action.onClick}>{action.label}</Button>
      ) : null}
    </div>
  );
}
