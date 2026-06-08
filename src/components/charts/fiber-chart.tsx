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
  fiber: { label: "Fibra (g)", color: "oklch(0.60 0.18 145)" },
} satisfies ChartConfig;

interface FiberChartProps {
  data: DailySummary[];
  goalFiber?: number;
}

export function FiberChart({ data, goalFiber }: FiberChartProps) {
  const chartData = data
    .filter((s) => s.meals.count > 0)
    .map((s) => ({
      date: s.date,
      fiber: Math.round(s.meals.total_fiber_grams * 10) / 10,
    }));

  if (chartData.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Fibra</CardTitle>
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
            <YAxis tick={{ fontSize: 12 }} unit=" g" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="fiber"
              stroke="var(--color-fiber)"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
            {goalFiber != null && (
              <ReferenceLine
                y={goalFiber}
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
