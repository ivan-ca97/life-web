"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useDate } from "@/lib/date/context";
import { X, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { addDays, format, parse, differenceInCalendarDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FoodSearchCombobox } from "@/components/food-search-combobox";
import { TagInput } from "@/components/tag-input";
import { MacroBar } from "@/components/macro-bar";
import { useMealPreview } from "@/lib/hooks/use-meals";
import { useMealTags } from "@/lib/hooks/use-tags";
import type { Meal, MealItemRequest } from "@/lib/types/meal";
import type { Food } from "@/lib/types/food";
import { fmtCal, fmtGrams } from "@/lib/format";

interface MealFormValues {
  date: string;
  eaten_time: string;
  type: string;
  name: string;
  photo_url: string;
  notes: string;
}

type MacroField = "calories" | "protein_grams" | "carbs_grams" | "fat_grams" | "fiber_grams";

const macroFieldsMeta: { key: MacroField; label: string }[] = [
  { key: "calories", label: "Calorias" },
  { key: "protein_grams", label: "Proteinas (g)" },
  { key: "carbs_grams", label: "Carbohidratos (g)" },
  { key: "fat_grams", label: "Grasas (g)" },
  { key: "fiber_grams", label: "Fibra (g)" },
];

interface MealItemRow {
  food_id: string;
  food_name: string;
  quantity: string;
  unit: string;
  food_base_unit: string;
  food_base_quantity: number;
  food_conversion_units: string[];
  notes: string;
}

interface MealFormProps {
  defaultValues?: Meal;
  onSubmit: (data: {
    date: string;
    eaten_at?: string;
    type: string;
    name?: string;
    photo_url: string;
    calories?: number;
    protein_grams?: number;
    carbs_grams?: number;
    fat_grams?: number;
    fiber_grams?: number;
    tags: string[];
    items: MealItemRequest[];
    notes: string;
  }) => void;
  isLoading: boolean;
}

function toOptNum(val: string): number | undefined {
  if (val === "") return undefined;
  const n = Number(val);
  if (isNaN(n)) return undefined;
  return n;
}

export function MealForm({ defaultValues, onSubmit, isLoading }: MealFormProps) {
  const { date: globalDate } = useDate();
  const [tags, setTags] = useState<string[]>(defaultValues?.tags ?? []);
  const [extraOpen, setExtraOpen] = useState(false);
  const { data: tagSuggestions } = useMealTags();
  const [submitError, setSubmitError] = useState("");
  const [dayOffset, setDayOffset] = useState<number>(() => {
    if (!defaultValues?.eaten_at || !defaultValues?.date) return 0;
    const diff = differenceInCalendarDays(
      parse(defaultValues.eaten_at.slice(0, 10), "yyyy-MM-dd", new Date()),
      parse(defaultValues.date, "yyyy-MM-dd", new Date())
    );
    return Math.max(0, Math.min(1, diff));
  });
  const [items, setItems] = useState<MealItemRow[]>(
    defaultValues?.items.map((i) => ({
      food_id: i.food_id,
      food_name: i.food_name,
      quantity: String(i.input_quantity),
      unit: i.input_unit,
      food_base_unit: i.normalized_unit,
      food_base_quantity: 0,
      food_conversion_units: [],
      notes: i.notes,
    })) ?? []
  );

  const previewItems = useMemo(
    () => items.map((i) => ({ food_id: i.food_id, quantity: Number(i.quantity), unit: i.unit })),
    [items]
  );
  const { data: preview, isFetching: previewLoading, error: previewError } = useMealPreview(previewItems);
  const [macroOverrides, setMacroOverrides] = useState<Partial<Record<MacroField, string>>>({});

  function getMacroValue(field: MacroField): string {
    if (field in macroOverrides) return macroOverrides[field]!;
    if (!preview) return "";
    const val = preview[field];
    if (val == null) return "";
    return field === "calories" ? fmtCal(val) : fmtGrams(val);
  }

  function isOverridden(field: MacroField): boolean {
    return field in macroOverrides;
  }

  function handleMacroChange(field: MacroField, value: string) {
    setMacroOverrides((prev) => ({ ...prev, [field]: value }));
  }

  function resetMacro(field: MacroField) {
    setMacroOverrides((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function getEffectiveNumber(field: MacroField): number {
    if (field in macroOverrides) return Number(macroOverrides[field]) || 0;
    return preview?.[field] ?? 0;
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MealFormValues>({
    defaultValues: {
      date: defaultValues?.date ?? globalDate,
      eaten_time: defaultValues?.eaten_at?.slice(11, 16) ?? (globalDate === format(new Date(), "yyyy-MM-dd") ? format(new Date(), "HH:mm") : "00:00"),
      type: defaultValues?.type ?? "",
      name: defaultValues?.name ?? "",
      photo_url: defaultValues?.photo_url ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  function handleAddFood(food: Food) {
    setItems([
      ...items,
      {
        food_id: food.id,
        food_name: food.name,
        quantity: String(food.base_quantity),
        unit: food.base_unit,
        food_base_unit: food.base_unit,
        food_base_quantity: food.base_quantity,
        food_conversion_units: food.conversions.map((c) => c.unit),
        notes: "",
      },
    ]);
  }

  function handleRemoveItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function handleItemChange(
    index: number,
    field: keyof MealItemRow,
    value: string | number
  ) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  function onFormSubmit(values: MealFormValues) {
    const hasMacros = macroFieldsMeta.some(({ key }) => getEffectiveNumber(key) > 0);
    const hasDescription = values.notes.trim() !== "" || values.name.trim() !== "";
    if (!hasMacros && !hasDescription) {
      setSubmitError("Agrega al menos un macro estimado o una descripcion/nota.");
      return;
    }
    setSubmitError("");
    onSubmit({
      date: values.date,
      eaten_at: values.eaten_time
        ? `${format(addDays(parse(values.date, "yyyy-MM-dd", new Date()), dayOffset), "yyyy-MM-dd")}T${values.eaten_time}:00Z`
        : undefined,
      type: values.type,
      name: values.name || undefined,
      photo_url: values.photo_url,
      calories: macroOverrides.calories !== undefined ? toOptNum(macroOverrides.calories) : undefined,
      protein_grams: macroOverrides.protein_grams !== undefined ? toOptNum(macroOverrides.protein_grams) : undefined,
      carbs_grams: macroOverrides.carbs_grams !== undefined ? toOptNum(macroOverrides.carbs_grams) : undefined,
      fat_grams: macroOverrides.fat_grams !== undefined ? toOptNum(macroOverrides.fat_grams) : undefined,
      fiber_grams: macroOverrides.fiber_grams !== undefined ? toOptNum(macroOverrides.fiber_grams) : undefined,
      tags,
      items: items.map((i) => ({
        food_id: i.food_id,
        quantity: Number(i.quantity),
        unit: i.unit,
        notes: i.notes,
      })),
      notes: values.notes,
    });
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" type="date" {...register("date", { required: "La fecha es obligatoria" })} />
          {errors.date && (
            <p className="text-sm text-destructive">{errors.date.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Tipo</Label>
          <Input id="type" placeholder="desayuno, almuerzo..." {...register("type", { required: "El tipo es obligatorio" })} />
          {errors.type && (
            <p className="text-sm text-destructive">{errors.type.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Hora</Label>
          <div className="flex items-center gap-1">
            <Input type="time" className="flex-1" {...register("eaten_time")} />
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className={dayOffset === 1 ? "text-primary" : ""}
              onClick={() => setDayOffset(dayOffset === 1 ? 0 : 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          {dayOffset === 1 && (
            <p className="text-xs text-muted-foreground">Dia siguiente</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm">Macros</Label>
          {previewLoading && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
          {previewError && (
            <span className="text-xs text-destructive">
              {previewError instanceof Error ? previewError.message : "Error al cargar preview"}
            </span>
          )}
        </div>
        <div className="grid grid-cols-5 gap-2 items-end">
          {macroFieldsMeta.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{label}</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={getMacroValue(key)}
                  onChange={(e) => handleMacroChange(key, e.target.value)}
                  className={isOverridden(key) ? "border-amber-500/70 pr-7" : ""}
                />
                {isOverridden(key) && (
                  <button
                    type="button"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => resetMacro(key)}
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <MacroBar
          protein={getEffectiveNumber("protein_grams")}
          carbs={getEffectiveNumber("carbs_grams")}
          fat={getEffectiveNumber("fat_grams")}
        />
      </div>

      <div className="space-y-3">
        <Label>Alimentos</Label>
        {items.map((item, index) => (
          <Card key={index}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{item.food_name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => handleRemoveItem(index)}
                >
                  <X className="size-3" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Cantidad</Label>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", e.target.value.replace(/^0+(?=\d)/, ""))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Unidad</Label>
                  <Select
                    value={item.unit}
                    onValueChange={(v) =>
                      handleItemChange(index, "unit", v ?? item.unit)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {item.food_base_unit && (
                        <SelectItem value={item.food_base_unit}>
                          {item.food_base_unit}
                        </SelectItem>
                      )}
                      {item.food_conversion_units.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Notas</Label>
                  <Input
                    value={item.notes}
                    onChange={(e) =>
                      handleItemChange(index, "notes", e.target.value)
                    }
                  />
                </div>
              </div>
              {item.food_base_quantity > 0 && (
                <p className="text-xs text-muted-foreground">
                  Porcion: {item.food_base_quantity} {item.food_base_unit}
                </p>
              )}
              {(() => {
                const pi = preview?.items?.[index];
                if (!pi) return null;
                const parts: string[] = [];
                if (pi.calories != null) parts.push(`${fmtCal(pi.calories)} kcal`);
                if (pi.protein_grams != null) parts.push(`${fmtGrams(pi.protein_grams)}g prot`);
                if (pi.carbs_grams != null) parts.push(`${fmtGrams(pi.carbs_grams)}g carbs`);
                if (pi.fat_grams != null) parts.push(`${fmtGrams(pi.fat_grams)}g grasa`);
                if (pi.fiber_grams != null) parts.push(`${fmtGrams(pi.fiber_grams)}g fibra`);
                if (parts.length === 0) return null;
                return (
                  <p className="text-xs text-muted-foreground">{parts.join(" · ")}</p>
                );
              })()}
            </CardContent>
          </Card>
        ))}
        <FoodSearchCombobox
          onSelect={handleAddFood}
          excludeIds={items.map((i) => i.food_id)}
        />
      </div>

      <div>
        <button
          type="button"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setExtraOpen(!extraOpen)}
        >
          <ChevronDown
            className={`size-4 transition-transform ${extraOpen ? "rotate-180" : ""}`}
          />
          Opciones adicionales
        </button>
        {extraOpen && (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" {...register("name")} />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <TagInput value={tags} onChange={setTags} suggestions={tagSuggestions} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" rows={2} {...register("notes")} />
            </div>
          </div>
        )}
      </div>

      {submitError && (
        <p className="text-sm text-destructive">{submitError}</p>
      )}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Guardando..." : "Guardar"}
      </Button>
    </form>
  );
}
