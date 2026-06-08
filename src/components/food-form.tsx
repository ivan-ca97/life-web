"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { X, Plus, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIngredients } from "@/lib/hooks/use-foods";
import { TagInput } from "@/components/tag-input";
import { useFoodTags } from "@/lib/hooks/use-tags";
import type {
  Food,
  MeasurementType,
  FoodConversionRequest,
  CreateFoodRequest,
} from "@/lib/types/food";

const MEASUREMENT_TYPE_LABELS: Record<MeasurementType, string> = {
  mass: "Peso (g, kg, mg)",
  volume: "Volumen (ml, cl, dl, l)",
  unit: "Unidad (u)",
};

const UNITS_BY_DIMENSION: Record<MeasurementType, string[]> = {
  mass: ["mg", "g", "kg"],
  volume: ["ml", "cl", "dl", "l"],
  unit: ["u"],
};

const ALL_METRIC_UNITS = [...UNITS_BY_DIMENSION.mass, ...UNITS_BY_DIMENSION.volume];

interface ConversionRow {
  unit: string;
  base_equivalent: string;
  note: string;
  inverted: boolean;
}

interface FoodFormValues {
  name: string;
  default_calories: string;
  default_protein_grams: string;
  default_carbs_grams: string;
  default_fat_grams: string;
  default_fiber_grams: string;
  base_quantity: string;
  base_unit: string;
  measurement_type: MeasurementType;
}

interface FoodFormProps {
  defaultValues?: Food;
  onSubmit: (data: CreateFoodRequest) => void;
  isLoading: boolean;
}

function toOptNum(val: string): number | undefined {
  if (val === "") return undefined;
  const n = Number(val);
  if (isNaN(n)) return undefined;
  return n;
}

export function FoodForm({ defaultValues, onSubmit, isLoading }: FoodFormProps) {
  const [tags, setTags] = useState<string[]>(defaultValues?.tags ?? []);
  const { data: tagSuggestions } = useFoodTags();
  const [ingredients, setIngredients] = useState<string[]>(
    defaultValues?.ingredients.map((i) => i.name) ?? []
  );
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredientFocused, setIngredientFocused] = useState(false);
  const ingredientRef = useRef<HTMLInputElement>(null);
  const [conversions, setConversions] = useState<ConversionRow[]>(
    defaultValues?.conversions.map((c) => ({
      unit: c.unit,
      base_equivalent: c.base_equivalent.toString(),
      note: c.note ?? "",
      inverted: c.inverse,
    })) ?? []
  );

  const { data: ingredientSuggestions } = useIngredients(ingredientInput);
  const filteredSuggestions = (ingredientSuggestions?.items ?? []).filter(
    (s) => !ingredients.some((i) => i.toLowerCase() === s.name.toLowerCase())
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FoodFormValues>({
    defaultValues: {
      name: defaultValues?.name ?? "",
      measurement_type: defaultValues?.measurement_type ?? "mass",
      default_calories: defaultValues?.default_calories?.toString() ?? "",
      default_protein_grams: defaultValues?.default_protein_grams?.toString() ?? "",
      default_carbs_grams: defaultValues?.default_carbs_grams?.toString() ?? "",
      default_fat_grams: defaultValues?.default_fat_grams?.toString() ?? "",
      default_fiber_grams: defaultValues?.default_fiber_grams?.toString() ?? "",
      base_quantity: defaultValues?.base_quantity?.toString() ?? "",
      base_unit: defaultValues?.base_unit ?? "g",
    },
  });

  const measurementType = watch("measurement_type");
  const baseUnits = UNITS_BY_DIMENSION[measurementType];
  const conversionUnits = measurementType === "unit"
    ? ALL_METRIC_UNITS
    : [...ALL_METRIC_UNITS, "u"];

  function addIngredient(value: string) {
    const trimmed = value.trim();
    if (trimmed && !ingredients.some((i) => i.toLowerCase() === trimmed.toLowerCase())) {
      setIngredients([...ingredients, trimmed]);
    }
    setIngredientInput("");
  }

  function handleIngredientKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    addIngredient(ingredientInput);
  }

  function handleRemoveIngredient(ingredient: string) {
    setIngredients(ingredients.filter((i) => i !== ingredient));
  }

  function handleAddConversion() {
    setConversions([
      ...conversions,
      { unit: "", base_equivalent: "", note: "", inverted: measurementType === "unit" },
    ]);
  }

  function handleToggleInversion(index: number) {
    const updated = [...conversions];
    const conv = updated[index];
    updated[index] = { ...conv, inverted: !conv.inverted, base_equivalent: "" };
    setConversions(updated);
  }

  function handleConversionChange(
    index: number,
    field: keyof ConversionRow,
    value: string
  ) {
    const updated = [...conversions];
    updated[index] = { ...updated[index], [field]: value };
    setConversions(updated);
  }

  function handleRemoveConversion(index: number) {
    setConversions(conversions.filter((_, i) => i !== index));
  }

  function onFormSubmit(values: FoodFormValues) {
    if (!values.base_unit) {
      setError("base_unit", { message: "La unidad base es obligatoria" });
      return;
    }

    const validConversions: FoodConversionRequest[] = [];
    for (const c of conversions) {
      const be = Number(c.base_equivalent);
      if (!c.unit || !be || be <= 0) continue;
      const conv: FoodConversionRequest = {
        unit: c.unit,
        base_equivalent: be,
      };
      if (c.inverted) conv.inverse = true;
      if (c.note.trim()) conv.note = c.note.trim();
      validConversions.push(conv);
    }

    onSubmit({
      name: values.name,
      measurement_type: values.measurement_type,
      base_quantity: toOptNum(values.base_quantity),
      base_unit: values.base_unit,
      default_calories: toOptNum(values.default_calories),
      default_protein_grams: toOptNum(values.default_protein_grams),
      default_carbs_grams: toOptNum(values.default_carbs_grams),
      default_fat_grams: toOptNum(values.default_fat_grams),
      default_fiber_grams: toOptNum(values.default_fiber_grams),
      conversions: validConversions,
      tags,
      ingredients,
    });
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 max-w-lg">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" {...register("name", { required: "El nombre es obligatorio" })} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Tipo de medida</Label>
        <Select
          value={measurementType}
          onValueChange={(v) => {
            const mt = (v ?? "mass") as MeasurementType;
            setValue("measurement_type", mt);
            const currentUnit = watch("base_unit");
            const units = UNITS_BY_DIMENSION[mt];
            if (!currentUnit || !units.includes(currentUnit)) {
              const defaultUnit = mt === "mass" ? "g" : mt === "volume" ? "ml" : "u";
              setValue("base_unit", defaultUnit);
            }
            if (mt === "unit" && !watch("base_quantity")) {
              setValue("base_quantity", "1");
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue>{MEASUREMENT_TYPE_LABELS[measurementType]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mass">Peso (g, kg, mg)</SelectItem>
            <SelectItem value="volume">Volumen (ml, cl, dl, l)</SelectItem>
            <SelectItem value="unit">Unidad (u)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="base_quantity">Cantidad base</Label>
          <Input
            id="base_quantity"
            type="number"
            step="any"
            min="0"
            placeholder="100"
            {...register("base_quantity")}
          />
        </div>
        <div className="space-y-2">
          <Label>Unidad base</Label>
          <Select
            value={watch("base_unit")}
            onValueChange={(v) => {
              setValue("base_unit", v ?? "");
              clearErrors("base_unit");
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {baseUnits.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.base_unit && (
            <p className="text-sm text-destructive">{errors.base_unit.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="default_calories">Calorias (kcal)</Label>
          <Input
            id="default_calories"
            type="number"
            step="any"
            min="0"
            {...register("default_calories")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="default_protein_grams">Proteinas (g)</Label>
          <Input
            id="default_protein_grams"
            type="number"
            step="any"
            min="0"
            {...register("default_protein_grams")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="default_carbs_grams">Carbohidratos (g)</Label>
          <Input
            id="default_carbs_grams"
            type="number"
            step="any"
            min="0"
            {...register("default_carbs_grams")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="default_fat_grams">Grasas (g)</Label>
          <Input
            id="default_fat_grams"
            type="number"
            step="any"
            min="0"
            {...register("default_fat_grams")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="default_fiber_grams">Fibra (g)</Label>
          <Input
            id="default_fiber_grams"
            type="number"
            step="any"
            min="0"
            {...register("default_fiber_grams")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Conversiones</Label>
          <Button type="button" variant="ghost" size="sm" onClick={handleAddConversion}>
            <Plus className="size-4 mr-1" />
            Agregar
          </Button>
        </div>
        {conversions.length > 0 && (
          <div className="space-y-2">
            {conversions.map((conv, index) => {
              const stdUnit = measurementType === "mass" ? "g" : measurementType === "volume" ? "ml" : "u";
              return (
                <Card key={index}>
                  <CardContent className="p-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground shrink-0">1</span>
                      {conv.inverted ? (
                        <>
                          <span className="text-sm font-medium shrink-0">{stdUnit}</span>
                          <span className="text-sm text-muted-foreground">=</span>
                          <Input
                            className="flex-1"
                            type="number"
                            step="any"
                            min="0"
                            value={conv.base_equivalent}
                            onChange={(e) =>
                              handleConversionChange(index, "base_equivalent", e.target.value)
                            }
                          />
                          <Select
                            value={conv.unit}
                            onValueChange={(v) =>
                              handleConversionChange(index, "unit", v ?? "")
                            }
                          >
                            <SelectTrigger className="w-20 shrink-0">
                              <SelectValue placeholder="?" />
                            </SelectTrigger>
                            <SelectContent>
                              {conversionUnits.map((u) => (
                                <SelectItem key={u} value={u}>
                                  {u}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      ) : (
                        <>
                          <Select
                            value={conv.unit}
                            onValueChange={(v) =>
                              handleConversionChange(index, "unit", v ?? "")
                            }
                          >
                            <SelectTrigger className="w-20 shrink-0">
                              <SelectValue placeholder="?" />
                            </SelectTrigger>
                            <SelectContent>
                              {conversionUnits.map((u) => (
                                <SelectItem key={u} value={u}>
                                  {u}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-sm text-muted-foreground">=</span>
                          <Input
                            className="flex-1"
                            type="number"
                            step="any"
                            min="0"
                            value={conv.base_equivalent}
                            onChange={(e) =>
                              handleConversionChange(index, "base_equivalent", e.target.value)
                            }
                          />
                          <span className="text-sm font-medium shrink-0">{stdUnit}</span>
                        </>
                      )}
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground shrink-0"
                        title="Invertir dirección"
                        onClick={() => handleToggleInversion(index)}
                      >
                        <ArrowRightLeft className="size-3.5" />
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0"
                        onClick={() => handleRemoveConversion(index)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Nota (opcional)</Label>
                      <Input
                        placeholder="Ej: arroz crudo, leche entera..."
                        value={conv.note}
                        onChange={(e) =>
                          handleConversionChange(index, "note", e.target.value)
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        {conversions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Sin conversiones. Ej: 1 ml = 0.85 g
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Ingredientes</Label>
        <div className="flex flex-wrap gap-1 mb-2">
          {ingredients.map((ingredient) => (
            <Badge key={ingredient} variant="secondary" className="gap-1">
              {ingredient}
              <button type="button" onClick={() => handleRemoveIngredient(ingredient)}>
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="relative">
          <Input
            ref={ingredientRef}
            placeholder="Buscar o agregar ingrediente..."
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
            onKeyDown={handleIngredientKeyDown}
            onFocus={() => setIngredientFocused(true)}
            onBlur={() => setTimeout(() => setIngredientFocused(false), 150)}
          />
          {ingredientFocused && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 top-full mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
              {filteredSuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addIngredient(s.name);
                    ingredientRef.current?.focus();
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <TagInput value={tags} onChange={setTags} suggestions={tagSuggestions} />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Guardando..." : "Guardar"}
      </Button>
    </form>
  );
}
