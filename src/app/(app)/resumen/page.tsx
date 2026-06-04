"use client";

import { useState } from "react";
import { useDate } from "@/lib/date/context";
import {
  Flame,
  Beef,
  Wheat,
  Droplets,
  Leaf,
  Footprints,
  Timer,
  Route,
  Plus,
  Weight,
  Target,
} from "lucide-react";
import { useDailySummary, useCorrection } from "@/lib/hooks/use-daily-summary";
import { fmtDuration } from "@/lib/format";
import { SummaryCard } from "@/components/summary-card";
import { MacroBar } from "@/components/macro-bar";
import { CorrectionPopover } from "@/components/correction-popover";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MealFormSheet } from "@/components/meal-form-sheet";
import { ExerciseFormSheet } from "@/components/exercise-form-sheet";
import { WeightFormSheet } from "@/components/weight-form-sheet";
import type { CorrectionField } from "@/lib/types/daily";

export default function ResumenPage() {
  const { date, isToday } = useDate();
  const [mealSheetOpen, setMealSheetOpen] = useState(false);
  const [exerciseSheetOpen, setExerciseSheetOpen] = useState(false);
  const [weightSheetOpen, setWeightSheetOpen] = useState(false);
  const { data, isLoading } = useDailySummary(date);
  const { data: correction } = useCorrection(date);

  /** The raw base value (summary minus correction delta) for the popover to compute new deltas. */
  function rawValue(summaryValue: number, field: CorrectionField): number {
    return summaryValue - ((correction?.[field] as number) ?? 0);
  }

  function correctionFor(field: CorrectionField, label: string, unit: string, summaryValue: number) {
    return (
      <CorrectionPopover
        date={date}
        field={field}
        label={label}
        unit={unit}
        baseValue={rawValue(summaryValue, field)}
        correction={correction}
      />
    );
  }

  function goalProgress(current: number, goal: number | undefined): string | null {
    if (goal == null || goal === 0) return null;
    return `${Math.round((current / goal) * 100)}%`;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Resumen diario</h1>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      ) : data ? (
        <>
          {(() => {
            const weightKg = data.weight?.weight_kg;
            const warn = isToday && weightKg == null && new Date().getHours() >= 6;
            return (
              <Card className={warn ? "border-amber-500/60 bg-amber-500/5" : undefined}>
                <CardHeader>
                  <CardTitle className="text-base">Peso</CardTitle>
                  <CardAction>
                    <Button variant="outline" size="sm" onClick={() => setWeightSheetOpen(true)}>
                      <Plus className="size-4" />
                      Registrar
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  {weightKg != null ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <SummaryCard
                        icon={<Weight className="size-5" />}
                        label="Peso matutino"
                        value={weightKg.toFixed(1)}
                        unit="kg"
                      />
                      {data.weight?.body_fat_percentage != null && (
                        <SummaryCard
                          icon={<Target className="size-5" />}
                          label="Grasa corporal"
                          value={data.weight.body_fat_percentage.toFixed(1)}
                          unit="%"
                        />
                      )}
                      {data.goals?.target_weight_kg != null && (
                        <SummaryCard
                          icon={<Target className="size-5" />}
                          label="Peso objetivo"
                          value={data.goals.target_weight_kg.toFixed(1)}
                          unit="kg"
                        />
                      )}
                    </div>
                  ) : (
                    <p className={`text-sm ${warn ? "text-amber-500 font-medium" : "text-muted-foreground"}`}>
                      Sin registro de peso para este dia.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Alimentacion ({data.meals.count} comidas)
              </CardTitle>
              <CardAction>
                <Button variant="outline" size="sm" onClick={() => setMealSheetOpen(true)}>
                  <Plus className="size-4" />
                  Agregar
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <SummaryCard
                  icon={<Flame className="size-5" />}
                  label="Calorias"
                  value={data.meals.total_calories.toFixed(0)}
                  unit="kcal"
                  subtitle={goalProgress(data.meals.total_calories, data.goals?.daily_calories)}
                  correction={correctionFor("calories", "Calorias", "kcal", data.meals.total_calories)}
                />
                <SummaryCard
                  icon={<Beef className="size-5" />}
                  label="Proteinas"
                  value={data.meals.total_protein_grams.toFixed(0)}
                  unit="g"
                  subtitle={goalProgress(data.meals.total_protein_grams, data.goals?.daily_protein_grams)}
                  correction={correctionFor("protein_grams", "Proteinas", "g", data.meals.total_protein_grams)}
                />
                <SummaryCard
                  icon={<Wheat className="size-5" />}
                  label="Carbohidratos"
                  value={data.meals.total_carbs_grams.toFixed(0)}
                  unit="g"
                  subtitle={goalProgress(data.meals.total_carbs_grams, data.goals?.daily_carbs_grams)}
                  correction={correctionFor("carbs_grams", "Carbohidratos", "g", data.meals.total_carbs_grams)}
                />
                <SummaryCard
                  icon={<Droplets className="size-5" />}
                  label="Grasas"
                  value={data.meals.total_fat_grams.toFixed(0)}
                  unit="g"
                  subtitle={goalProgress(data.meals.total_fat_grams, data.goals?.daily_fat_grams)}
                  correction={correctionFor("fat_grams", "Grasas", "g", data.meals.total_fat_grams)}
                />
                <SummaryCard
                  icon={<Leaf className="size-5" />}
                  label="Fibra"
                  value={data.meals.total_fiber_grams.toFixed(0)}
                  unit="g"
                  subtitle={goalProgress(data.meals.total_fiber_grams, data.goals?.daily_fiber_grams)}
                  correction={correctionFor("fiber_grams", "Fibra", "g", data.meals.total_fiber_grams)}
                />
              </div>
              {data.meals.count > 0 && (
                <MacroBar
                  protein={data.meals.total_protein_grams}
                  carbs={data.meals.total_carbs_grams}
                  fat={data.meals.total_fat_grams}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Ejercicio ({data.exercise.count} actividades)
              </CardTitle>
              <CardAction>
                <Button variant="outline" size="sm" onClick={() => setExerciseSheetOpen(true)}>
                  <Plus className="size-4" />
                  Agregar
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  icon={<Flame className="size-5" />}
                  label="Calorias quemadas"
                  value={data.exercise.total_calories_burned.toFixed(0)}
                  unit="kcal"
                  correction={correctionFor("calories_burned", "Calorias quemadas", "kcal", data.exercise.total_calories_burned)}
                />
                <SummaryCard
                  icon={<Footprints className="size-5" />}
                  label="Pasos"
                  value={data.exercise.total_steps.toFixed(0)}
                  subtitle={goalProgress(data.exercise.total_steps, data.goals?.daily_steps)}
                  correction={correctionFor("steps", "Pasos", "pasos", data.exercise.total_steps)}
                />
                <SummaryCard
                  icon={<Timer className="size-5" />}
                  label="Duracion"
                  value={fmtDuration(data.exercise.total_duration_seconds)}
                  subtitle={goalProgress(
                    Math.round(data.exercise.total_duration_seconds / 60),
                    data.goals?.daily_exercise_minutes
                  )}
                  correction={
                    <CorrectionPopover
                      date={date}
                      field="duration_seconds"
                      label="Duracion"
                      unit="seg"
                      baseValue={rawValue(data.exercise.total_duration_seconds, "duration_seconds")}
                      correction={correction}
                      durationMode
                    />
                  }
                />
                <SummaryCard
                  icon={<Route className="size-5" />}
                  label="Distancia"
                  value={(data.exercise.total_distance_meters / 1000).toFixed(1)}
                  unit="km"
                  correction={correctionFor("distance_meters", "Distancia", "m", data.exercise.total_distance_meters)}
                />
              </div>
            </CardContent>
          </Card>

          {data.meals.total_calories > 0 && data.exercise.total_calories_burned > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Balance calorico neto</p>
                <p className="text-3xl font-semibold tabular-nums">
                  {(data.meals.total_calories - data.exercise.total_calories_burned).toFixed(0)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">kcal</span>
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
      <MealFormSheet open={mealSheetOpen} onOpenChange={setMealSheetOpen} />
      <ExerciseFormSheet open={exerciseSheetOpen} onOpenChange={setExerciseSheetOpen} />
      <WeightFormSheet open={weightSheetOpen} onOpenChange={setWeightSheetOpen} defaultDate={date} />
    </div>
  );
}
