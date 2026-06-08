import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface SummaryCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string | null;
}

export function SummaryCard({ icon, label, value, unit, subtitle }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="text-muted-foreground">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tabular-nums">
            {value}
            {unit && (
              <span className="text-sm font-normal text-muted-foreground ml-1">
                {unit}
              </span>
            )}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
