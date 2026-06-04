"use client";

import { format, subDays } from "date-fns";
import { Button } from "@/components/ui/button";

const presets = [
  { label: "7 dias", days: 7 },
  { label: "14 dias", days: 14 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
] as const;

interface DateRangeSelectorProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

export function DateRangeSelector({ from, to, onChange }: DateRangeSelectorProps) {
  const today = format(new Date(), "yyyy-MM-dd");

  function activeDays(): number | null {
    if (to !== today) return null;
    const diffMs = new Date(to).getTime() - new Date(from).getTime();
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return presets.some((p) => p.days === days) ? days : null;
  }

  const active = activeDays();

  return (
    <div className="flex gap-2">
      {presets.map((p) => (
        <Button
          key={p.days}
          variant={active === p.days ? "default" : "outline"}
          size="sm"
          onClick={() =>
            onChange(format(subDays(new Date(), p.days), "yyyy-MM-dd"), today)
          }
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}
