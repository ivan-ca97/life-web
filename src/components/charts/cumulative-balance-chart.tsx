"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailySummary } from "@/lib/types/daily";

const SURPLUS_COLOR = "oklch(0.65 0.18 55)";
const DEFICIT_COLOR = "oklch(0.65 0.18 230)";

const chartConfig = {
  cumulative: { label: "Acumulado (kcal)", color: SURPLUS_COLOR },
} satisfies ChartConfig;

interface CumulativeBalanceChartProps {
  data: DailySummary[];
}

export function CumulativeBalanceChart({ data }: CumulativeBalanceChartProps) {
  const filtered = data.filter((s) => s.caloric_balance != null);
  if (filtered.length === 0) return null;

  let sum = 0;
  const chartData = filtered.map((s) => {
    sum += s.caloric_balance!;
    return { date: s.date, cumulative: Math.round(sum) };
  });

  const lastValue = chartData[chartData.length - 1].cumulative;
  const fillColor = lastValue >= 0 ? SURPLUS_COLOR : DEFICIT_COLOR;
  const strokeColor = fillColor;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Balance calorico acumulado</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart data={chartData} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => v.slice(5)}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <ReferenceLine y={0} stroke="var(--border)" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke={strokeColor}
              fill={fillColor}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
