"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FoodFrequencyItem } from "@/lib/types/food";

const chartConfig = {
  count: { label: "Veces", color: "oklch(0.65 0.18 45)" },
} satisfies ChartConfig;

interface FoodFrequencyChartProps {
  data: FoodFrequencyItem[];
  limit?: number;
}

export function FoodFrequencyChart({ data, limit = 10 }: FoodFrequencyChartProps) {
  const sorted = [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .reverse();

  if (sorted.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Alimentos mas consumidos</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="w-full"
          style={{ height: `${Math.max(200, sorted.length * 36)}px` }}
        >
          <BarChart data={sorted} layout="vertical" accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis
              dataKey="food_name"
              type="category"
              width={120}
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => (v.length > 18 ? v.slice(0, 16) + "..." : v)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
