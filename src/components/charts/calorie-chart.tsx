"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailySummary } from "@/lib/types/daily";

const chartConfig = {
  consumed: { label: "Consumidas", color: "oklch(0.75 0.18 55)" },
  burned: { label: "Gasto total", color: "oklch(0.55 0.15 160)" },
  bmr: { label: "Metabolismo basal", color: "oklch(0.6 0.08 260)" },
} satisfies ChartConfig;

interface CalorieChartProps {
  data: DailySummary[];
  goalCalories?: number;
}

export function CalorieChart({ data, goalCalories }: CalorieChartProps) {
  const relevant = data.filter(
    (s) => s.meals.total_calories > 0 || s.exercise.total_calories_burned > 0,
  );
  const hasBmr = relevant.some((s) => s.estimated_bmr != null);
  const chartData = relevant.map((s) => ({
    date: s.date,
    consumed: Math.round(s.meals.total_calories),
    burned: Math.round(s.exercise.total_calories_burned + (s.estimated_bmr ?? 0)),
    ...(s.estimated_bmr != null ? { bmr: Math.round(s.estimated_bmr) } : {}),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Calorias</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={chartData} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => v.slice(5)}
              tick={{ fontSize: 12 }}
            />
            <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              type="monotone"
              dataKey="consumed"
              stroke="var(--color-consumed)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="burned"
              stroke="var(--color-burned)"
              strokeWidth={2}
              dot={false}
            />
            {hasBmr && (
              <Line
                type="monotone"
                dataKey="bmr"
                stroke="var(--color-bmr)"
                strokeWidth={1.5}
                strokeOpacity={0.5}
                strokeDasharray="6 3"
                dot={false}
              />
            )}
            {goalCalories != null && (
              <ReferenceLine
                y={goalCalories}
                stroke="var(--muted-foreground)"
                strokeDasharray="5 5"
                label={{ value: "Meta", position: "insideTopRight", fontSize: 11 }}
              />
            )}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
