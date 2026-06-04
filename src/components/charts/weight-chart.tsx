"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const chartConfig = {
  weight_kg: { label: "Peso (kg)", color: "oklch(0.55 0.15 160)" },
} satisfies ChartConfig;

interface WeightChartProps {
  data: Array<{ date: string; weight_kg: number }>;
  goalWeight?: number;
}

export function WeightChart({ data, goalWeight }: WeightChartProps) {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Peso</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <LineChart data={data} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => v.slice(5)}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={["dataMin - 1", "dataMax + 1"]}
              tick={{ fontSize: 12 }}
              unit=" kg"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="weight_kg"
              stroke="var(--color-weight_kg)"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
            {goalWeight != null && (
              <ReferenceLine
                y={goalWeight}
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
