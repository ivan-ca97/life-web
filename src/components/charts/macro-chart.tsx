"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
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
  protein: { label: "Proteina", color: "oklch(0.62 0.21 255)" },
  carbs: { label: "Carbohidratos", color: "oklch(0.75 0.18 75)" },
  fat: { label: "Grasa", color: "oklch(0.65 0.20 15)" },
} satisfies ChartConfig;

interface MacroChartProps {
  data: DailySummary[];
}

export function MacroChart({ data }: MacroChartProps) {
  const chartData = data.map((s) => ({
    date: s.date,
    protein: Math.round(s.meals.total_protein_grams),
    carbs: Math.round(s.meals.total_carbs_grams),
    fat: Math.round(s.meals.total_fat_grams),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Macronutrientes</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={chartData} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => v.slice(5)}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} unit="g" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type="monotone"
              dataKey="fat"
              stackId="1"
              stroke="var(--color-fat)"
              fill="var(--color-fat)"
              fillOpacity={0.4}
            />
            <Area
              type="monotone"
              dataKey="carbs"
              stackId="1"
              stroke="var(--color-carbs)"
              fill="var(--color-carbs)"
              fillOpacity={0.4}
            />
            <Area
              type="monotone"
              dataKey="protein"
              stackId="1"
              stroke="var(--color-protein)"
              fill="var(--color-protein)"
              fillOpacity={0.4}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
