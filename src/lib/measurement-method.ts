import type { MeasurementMethod } from "@/lib/types/meal";

interface MethodMeta {
  label: string;
  shortLabel: string;
  color: string;
}

const METHOD_META: Record<MeasurementMethod, MethodMeta> = {
  weighed_raw: { label: "Pesado en crudo", shortLabel: "Crudo", color: "text-green-500" },
  weighed_cooked: { label: "Pesado cocido", shortLabel: "Cocido", color: "text-green-500" },
  label: { label: "Etiqueta", shortLabel: "Etiqueta", color: "text-emerald-400" },
  standard_portion: { label: "Porcion estandar", shortLabel: "Porcion", color: "text-blue-400" },
  photo_estimate: { label: "Estimado por foto", shortLabel: "Est.foto", color: "text-amber-400" },
  visual_estimate: { label: "Estimado visual", shortLabel: "Visual", color: "text-orange-400" },
};

export function getMethodMeta(method: string | undefined): MethodMeta | null {
  if (!method) return null;
  return METHOD_META[method as MeasurementMethod] ?? null;
}

export function getMethodLabel(method: string): string {
  const meta = METHOD_META[method as MeasurementMethod];
  return meta?.label ?? "";
}

export const MEASUREMENT_METHODS: { value: MeasurementMethod; label: string }[] = [
  { value: "weighed_raw", label: "Pesado en crudo" },
  { value: "weighed_cooked", label: "Pesado cocido" },
  { value: "label", label: "Etiqueta" },
  { value: "standard_portion", label: "Porcion estandar" },
  { value: "photo_estimate", label: "Estimado por foto" },
  { value: "visual_estimate", label: "Estimado visual" },
];
