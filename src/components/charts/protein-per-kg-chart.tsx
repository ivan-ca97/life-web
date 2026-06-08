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
  protein_per_kg: { label: "Proteina (g/kg)", color: "oklch(0.62 0.21 255)" },
} satisfies ChartConfig;

const DEFAULT_REFERENCE = 1.6;

interface ProteinPerKgChartProps {
  data: DailySummary[];
  goalProteinPerKg?: number;
}

export function ProteinPerKgChart({ data, goalProteinPerKg }: ProteinPerKgChartProps) {
  // Carry the last known weight forward so days without a weigh-in still get a value
  let lastWeight: number | null = null;
  const chartData: Array<{ date: string; protein_per_kg: number }> = [];

  for (const s of data) {
    if (s.weight?.weight_kg != null) {
      lastWeight = s.weight.weight_kg;
    }
    if (lastWeight != null && s.meals.count > 0) {
      chartData.push({
        date: s.date,
        protein_per_kg: Math.round((s.meals.total_protein_grams / lastWeight) * 100) / 100,
      });
    }
  }

  if (chartData.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Proteina por kg de peso</CardTitle>
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
            <YAxis
              tick={{ fontSize: 12 }}
              unit=" g/kg"
              domain={[0, "auto"]}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="protein_per_kg"
              stroke="var(--color-protein_per_kg)"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
            {/* Common recommendation ranges */}
            <ReferenceLine
              y={goalProteinPerKg ?? DEFAULT_REFERENCE}
              stroke="var(--muted-foreground)"
              strokeDasharray="5 5"
              label={{
                value: goalProteinPerKg != null ? "Meta" : `Ref. ${DEFAULT_REFERENCE} g/kg`,
                position: "insideTopRight",
                fontSize: 11,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
