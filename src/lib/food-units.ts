import type { Food } from "@/lib/types/food";

const METRIC_UNITS: Record<string, string[]> = {
  mass: ["mg", "g", "kg"],
  volume: ["ml", "cl", "dl", "l"],
  unit: ["u"],
};

const ALL_METRIC = new Set([...METRIC_UNITS.mass, ...METRIC_UNITS.volume, "u"]);

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

export function isMetricUnit(unit: string): boolean {
  return ALL_METRIC.has(unit);
}

const METRIC_FACTORS: Record<string, Record<string, number>> = {
  mass: { mg: 0.001, g: 1, kg: 1000 },
  volume: { ml: 1, cl: 10, dl: 100, l: 1000 },
};

export function buildUnitMap(food: Food): Record<string, number> {
  const map: Record<string, number> = {};

  const base = METRIC_FACTORS[food.measurement_type];
  if (base) Object.assign(map, base);

  if (food.volume_conversion) {
    const gpm = food.volume_conversion.grams_per_ml;
    if (food.measurement_type === "mass") {
      map["ml"] = gpm;
      map["cl"] = gpm * 10;
      map["dl"] = gpm * 100;
      map["l"] = gpm * 1000;
    } else if (food.measurement_type === "volume") {
      map["mg"] = 1 / gpm / 1000;
      map["g"] = 1 / gpm;
      map["kg"] = 1000 / gpm;
    }
  }

  if (food.unit_conversion) {
    map["u"] = food.unit_conversion.base_equivalent;
  }

  for (const p of food.portions) {
    map[p.name] = p.base_equivalent;
  }

  return map;
}
