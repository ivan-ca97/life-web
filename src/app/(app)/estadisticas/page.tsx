"use client";

import { useState } from "react";
import { format, subDays } from "date-fns";
import { useDate } from "@/lib/date/context";
import { useDailySummaryRange } from "@/lib/hooks/use-daily-summary";
import { useFoodFrequency } from "@/lib/hooks/use-foods";
import { useGoals } from "@/lib/hooks/use-goals";
import { DateRangeSelector } from "@/components/date-range-selector";
import { CalorieChart } from "@/components/charts/calorie-chart";
import { BalanceChart } from "@/components/charts/balance-chart";
import { MacroChart } from "@/components/charts/macro-chart";
import { MacroPercentChart } from "@/components/charts/macro-percent-chart";
import { WeightChart } from "@/components/charts/weight-chart";
import { ExerciseChart } from "@/components/charts/exercise-chart";
import { FoodFrequencyChart } from "@/components/charts/food-frequency-chart";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function EstadisticasPage() {
  const { date } = useDate();
  const [daysBack, setDaysBack] = useState(30);

  const to = date;
  const from = format(subDays(new Date(date), daysBack), "yyyy-MM-dd");

  const { data: rangeData, isLoading, isError } = useDailySummaryRange(from, to);
  const { data: foodFreq } = useFoodFrequency({ from, to });
  const { data: goals } = useGoals();

  const summaries = rangeData?.data ?? [];

  const weightData = summaries
    .filter((s) => s.weight?.weight_kg != null)
    .map((s) => ({ date: s.date, weight_kg: s.weight!.weight_kg! }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Estadisticas</h1>
      </div>

      <DateRangeSelector
        from={from}
        to={to}
        onChange={(f) => {
          const diffMs = new Date(to).getTime() - new Date(f).getTime();
          setDaysBack(Math.round(diffMs / (1000 * 60 * 60 * 24)));
        }}
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[340px] w-full rounded-xl" />
          <Skeleton className="h-[340px] w-full rounded-xl" />
          <Skeleton className="h-[290px] w-full rounded-xl" />
        </div>
      ) : isError || summaries.length === 0 ? (
        <EmptyState message={isError ? "Error al cargar estadisticas" : "No hay datos para el rango seleccionado"} />
      ) : (
        <div className="space-y-4">
          <CalorieChart data={summaries} goalCalories={goals?.daily_calories} />
          <BalanceChart data={summaries} />
          <MacroChart data={summaries} />
          <MacroPercentChart data={summaries} />
          <WeightChart data={weightData} goalWeight={goals?.target_weight_kg} />
          <ExerciseChart data={summaries} goalSteps={goals?.daily_steps} />
          <FoodFrequencyChart data={foodFreq?.items ?? []} />
        </div>
      )}
    </div>
  );
}
