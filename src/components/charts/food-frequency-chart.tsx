"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FoodFrequencyItem } from "@/lib/types/food";

const chartConfig = {
  count: { label: "Veces", color: "oklch(0.65 0.18 45)" },
} satisfies ChartConfig;

interface FoodFrequencyChartProps {
  data: FoodFrequencyItem[];
  limit?: number;
}

export function FoodFrequencyChart({ data, limit = 10 }: FoodFrequencyChartProps) {
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  const filtered = data.filter((d) => !excluded.has(d.food_id));
  const sorted = [...filtered]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .reverse();

  if (sorted.length === 0 && excluded.size === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Alimentos mas consumidos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {excluded.size > 0 && (
          <div className="flex flex-wrap gap-1">
            {data
              .filter((d) => excluded.has(d.food_id))
              .map((d) => (
                <Badge
                  key={d.food_id}
                  variant="secondary"
                  className="gap-1 text-xs cursor-pointer"
                  onClick={() => setExcluded((prev) => {
                    const next = new Set(prev);
                    next.delete(d.food_id);
                    return next;
                  })}
                >
                  {d.food_name}
                  <X className="size-3" />
                </Badge>
              ))}
          </div>
        )}
        {sorted.length > 0 ? (
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
                cursor="pointer"
                onClick={(_data, index) => {
                  const item = sorted[index];
                  if (item) {
                    setExcluded((prev) => new Set(prev).add(item.food_id));
                  }
                }}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Todos los alimentos excluidos
          </p>
        )}
      </CardContent>
    </Card>
  );
}
