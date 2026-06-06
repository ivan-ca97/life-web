"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ReferenceLine } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailySummary } from "@/lib/types/daily";

const SURPLUS_COLOR = "oklch(0.65 0.18 145)";
const DEFICIT_COLOR = "oklch(0.65 0.2 15)";

const chartConfig = {
  balance: { label: "Balance", color: SURPLUS_COLOR },
} satisfies ChartConfig;

interface BalanceChartProps {
  data: DailySummary[];
}

export function BalanceChart({ data }: BalanceChartProps) {
  const chartData = data
    .filter((s) => s.caloric_balance != null)
    .map((s) => ({
      date: s.date,
      balance: Math.round(s.caloric_balance!),
    }));

  if (chartData.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Balance calorico</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={chartData} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => v.slice(5)}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <ReferenceLine y={0} stroke="var(--border)" />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => {
                    const v = value as number;
                    return `${Math.abs(v)} kcal ${v >= 0 ? "superavit" : "deficit"}`;
                  }}
                />
              }
            />
            <Bar dataKey="balance" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.balance >= 0 ? SURPLUS_COLOR : DEFICIT_COLOR}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
