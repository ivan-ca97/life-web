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
  burned: { label: "Quemadas", color: "oklch(0.55 0.15 160)" },
} satisfies ChartConfig;

interface CalorieChartProps {
  data: DailySummary[];
  goalCalories?: number;
}

export function CalorieChart({ data, goalCalories }: CalorieChartProps) {
  const chartData = data.map((s) => ({
    date: s.date,
    consumed: Math.round(s.meals.total_calories),
    burned: Math.round(s.exercise.total_calories_burned),
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
            <YAxis tick={{ fontSize: 12 }} />
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
