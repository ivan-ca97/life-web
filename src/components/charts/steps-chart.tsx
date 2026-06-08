"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";
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

interface StepsChartProps {
  data: DailySummary[];
  goalSteps?: number;
}

export function StepsChart({ data, goalSteps }: StepsChartProps) {
  const chartData = data
    .filter((s) => s.exercise.total_steps > 0)
    .map((s) => ({
      date: s.date,
      steps: s.exercise.total_steps,
    }));

  if (chartData.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Pasos</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <LineChart data={chartData} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => v.slice(5)}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="steps"
              stroke="var(--color-steps)"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
            {goalSteps != null && (
              <ReferenceLine
                y={goalSteps}
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
