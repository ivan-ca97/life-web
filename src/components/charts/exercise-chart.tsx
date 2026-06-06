"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailySummary } from "@/lib/types/daily";

const chartConfig = {
  steps: { label: "Pasos", color: "oklch(0.65 0.15 300)" },
} satisfies ChartConfig;

interface ExerciseChartProps {
  data: DailySummary[];
  goalSteps?: number;
}

export function ExerciseChart({ data, goalSteps }: ExerciseChartProps) {
  const chartData = data
    .filter((s) => s.exercise.total_steps > 0 || s.exercise.total_calories_burned > 0)
    .map((s) => ({
      date: s.date,
      steps: s.exercise.total_steps,
    }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Pasos diarios</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={chartData} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => v.slice(5)}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="steps"
              fill="var(--color-steps)"
              radius={[4, 4, 0, 0]}
            />
            {goalSteps != null && (
              <ReferenceLine
                y={goalSteps}
                stroke="var(--muted-foreground)"
                strokeDasharray="5 5"
                label={{ value: "Meta", position: "insideTopRight", fontSize: 11 }}
              />
            )}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
