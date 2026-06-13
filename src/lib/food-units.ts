import type { Food } from "@/lib/types/food";

const METRIC_UNITS: Record<string, string[]> = {
  mass: ["mg", "g", "kg"],
  volume: ["ml", "cl", "dl", "l"],
  unit: ["u"],
};

export function getAvailableUnits(food: Food): string[] {
  const units: string[] = [];

  const metric = METRIC_UNITS[food.measurement_type] ?? [];
  for (const u of metric) {
    if (!units.includes(u)) units.push(u);
  }

  if (food.volume_conversion && food.measurement_type === "mass") {
    for (const u of METRIC_UNITS.volume) {
      if (!units.includes(u)) units.push(u);
    }
  }
  if (food.volume_conversion && food.measurement_type === "volume") {
    for (const u of METRIC_UNITS.mass) {
      if (!units.includes(u)) units.push(u);
    }
  }

  if (food.unit_conversion && food.measurement_type !== "unit") {
    units.push("u");
  }

  for (const p of food.portions) {
    if (!units.includes(p.name)) units.push(p.name);
  }

  return units;
}
