"use client";

import { Target, TrendingDown, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GoalMetric, GoalProgress } from "@/lib/types/goal";

const METRICS: { key: keyof GoalProgress; label: string; unit: string }[] = [
  { key: "daily_calories", label: "Calorias", unit: "kcal" },
  { key: "daily_protein_grams", label: "Proteinas", unit: "g" },
  { key: "daily_carbs_grams", label: "Carbohidratos", unit: "g" },
  { key: "daily_fat_grams", label: "Grasas", unit: "g" },
  { key: "daily_fiber_grams", label: "Fibra", unit: "g" },
  { key: "daily_steps", label: "Pasos", unit: "" },
  { key: "daily_exercise_minutes", label: "Ejercicio", unit: "min" },
];

function MetricRow({ metric, label, unit }: { metric: GoalMetric; label: string; unit: string }) {
  const pct = metric.days_tracked > 0
    ? Math.round((metric.days_met / metric.days_tracked) * 100)
    : 0;

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {metric.average.toFixed(0)}{unit ? ` ${unit}` : ""} / {metric.target.toFixed(0)}{unit ? ` ${unit}` : ""}
          </span>
        </div>
        <div className="mt-1 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            {metric.days_met}/{metric.days_tracked} dias cumplidos
          </span>
          <span className="text-xs font-medium tabular-nums">{pct}%</span>
        </div>
      </div>
    </div>
  );
}

interface GoalProgressCardProps {
  progress: GoalProgress;
}

export function GoalProgressCard({ progress }: GoalProgressCardProps) {
  const activeMetrics = METRICS.filter((m) => progress[m.key] != null);

  if (activeMetrics.length === 0 && !progress.weight_progress) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="size-4" />
          Progreso de metas ({progress.days_total} dias)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 divide-y sm:divide-y-0">
          {activeMetrics.map((m) => (
            <MetricRow
              key={m.key}
              metric={progress[m.key] as GoalMetric}
              label={m.label}
              unit={m.unit}
            />
          ))}
        </div>
        {progress.weight_progress && (
          <div className="flex items-center gap-3 pt-3 border-t">
            {progress.weight_progress.current_kg != null ? (
              <>
                <TrendingDown className="size-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <span className="text-sm font-medium">Peso</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {progress.weight_progress.current_kg.toFixed(1)} kg → {progress.weight_progress.target_kg.toFixed(1)} kg
                  </span>
                  {(() => {
                    const diff = progress.weight_progress!.current_kg! - progress.weight_progress!.target_kg;
                    const atGoal = Math.abs(diff) < 0.5;
                    return atGoal ? (
                      <CheckCircle2 className="inline size-4 text-green-500 ml-1" />
                    ) : (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({diff > 0 ? "-" : "+"}{Math.abs(diff).toFixed(1)} kg)
                      </span>
                    );
                  })()}
                </div>
              </>
            ) : (
              <>
                <Target className="size-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">
                  Peso objetivo: {progress.weight_progress.target_kg.toFixed(1)} kg (sin registro reciente)
                </span>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
