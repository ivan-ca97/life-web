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

interface MacroPercentChartProps {
  data: DailySummary[];
}

export function MacroPercentChart({ data }: MacroPercentChartProps) {
  const chartData = data
    .filter((s) => s.meals.total_calories > 0)
    .map((s) => {
      const p = s.meals.total_protein_grams;
      const c = s.meals.total_carbs_grams;
      const f = s.meals.total_fat_grams;
      const total = p + c + f;
      if (total === 0) return { date: s.date, protein: 0, carbs: 0, fat: 0 };
      return {
        date: s.date,
        protein: Math.round((p / total) * 100),
        carbs: Math.round((c / total) * 100),
        fat: Math.round((f / total) * 100),
      };
    });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Distribucion de macros (%)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart data={chartData} accessibilityLayer stackOffset="expand">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => v.slice(5)}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(v) => `${Math.round(v * 100)}%`}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type="monotone"
              dataKey="protein"
              stackId="1"
              stroke="var(--color-protein)"
              fill="var(--color-protein)"
              fillOpacity={0.8}
            />
            <Area
              type="monotone"
              dataKey="carbs"
              stackId="1"
              stroke="var(--color-carbs)"
              fill="var(--color-carbs)"
              fillOpacity={0.8}
            />
            <Area
              type="monotone"
              dataKey="fat"
              stackId="1"
              stroke="var(--color-fat)"
              fill="var(--color-fat)"
              fillOpacity={0.8}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
