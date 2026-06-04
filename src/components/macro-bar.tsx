import { fmtGrams } from "@/lib/format";

interface MacroBarProps {
  protein: number;
  carbs: number;
  fat: number;
}

export function MacroBar({ protein, carbs, fat }: MacroBarProps) {
  const total = protein + carbs + fat;

  if (total === 0) {
    return (
      <div className="h-2 w-full rounded-full bg-muted" />
    );
  }

  const proteinPct = (protein / total) * 100;
  const carbsPct = (carbs / total) * 100;
  const fatPct = (fat / total) * 100;

  return (
    <div className="space-y-1">
      <div className="flex h-2 w-full overflow-hidden rounded-full">
        <div
          className="bg-blue-500"
          style={{ width: `${proteinPct}%` }}
        />
        <div
          className="bg-amber-500"
          style={{ width: `${carbsPct}%` }}
        />
        <div
          className="bg-rose-500"
          style={{ width: `${fatPct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-blue-500" />
          Prot {fmtGrams(protein)}g
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-amber-500" />
          Carbs {fmtGrams(carbs)}g
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-rose-500" />
          Grasa {fmtGrams(fat)}g
        </span>
      </div>
    </div>
  );
}
