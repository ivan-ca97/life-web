"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { X, Plus } from "lucide-react";
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
import { PhotoUpload } from "@/components/photo-upload";
import { useFoodTags } from "@/lib/hooks/use-tags";
import type { UploadedPhoto } from "@/lib/hooks/use-media";
import type {
  Food,
  MeasurementType,
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

interface PortionRow {
  name: string;
  base_equivalent: string;
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
  const [photo, setPhoto] = useState<UploadedPhoto[]>(
    defaultValues?.photo_url ? [{ url: defaultValues.photo_url, is_primary: true }] : []
  );
  const { data: tagSuggestions } = useFoodTags();
  const [ingredients, setIngredients] = useState<string[]>(
    defaultValues?.ingredients?.map((i) => i.name) ?? []
  );
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredientFocused, setIngredientFocused] = useState(false);
  const ingredientRef = useRef<HTMLInputElement>(null);

  const [gramsPerMl, setGramsPerMl] = useState(
    defaultValues?.volume_conversion?.grams_per_ml?.toString() ?? ""
  );
  const [volumeNote, setVolumeNote] = useState(
    defaultValues?.volume_conversion?.note ?? ""
  );
  const [unitBaseEquivalent, setUnitBaseEquivalent] = useState(
    defaultValues?.unit_conversion?.base_equivalent?.toString() ?? ""
  );
  const [unitNote, setUnitNote] = useState(
    defaultValues?.unit_conversion?.note ?? ""
  );
  const [portions, setPortions] = useState<PortionRow[]>(
    defaultValues?.portions?.map((p) => ({
      name: p.name,
      base_equivalent: p.base_equivalent.toString(),
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

  function handleAddPortion() {
    setPortions([...portions, { name: "", base_equivalent: "" }]);
  }

  function handlePortionChange(index: number, field: keyof PortionRow, value: string) {
    const updated = [...portions];
    updated[index] = { ...updated[index], [field]: value };
    setPortions(updated);
  }

  function handleRemovePortion(index: number) {
    setPortions(portions.filter((_, i) => i !== index));
  }

  function onFormSubmit(values: FoodFormValues) {
    if (!values.base_unit) {
      setError("base_unit", { message: "La unidad base es obligatoria" });
      return;
    }

    const conversions: CreateFoodRequest["conversions"] = {};
    const gpm = Number(gramsPerMl);
    if (gpm > 0) {
      conversions.volume_conversion = { grams_per_ml: gpm };
      if (volumeNote.trim()) conversions.volume_conversion.note = volumeNote.trim();
    }
    const ube = Number(unitBaseEquivalent);
    if (ube > 0) {
      conversions.unit_conversion = { base_equivalent: ube };
      if (unitNote.trim()) conversions.unit_conversion.note = unitNote.trim();
    }
    const hasConversions = conversions.volume_conversion || conversions.unit_conversion;

    const validPortions = portions
      .filter((p) => p.name.trim() && Number(p.base_equivalent) > 0)
      .map((p) => ({ name: p.name.trim(), base_equivalent: Number(p.base_equivalent) }));

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
      photo_url: photo.length > 0 ? photo[0].url : undefined,
      conversions: hasConversions ? conversions : undefined,
      portions: validPortions,
      tags,
      ingredients,
    });
  }

  const baseUnit = watch("base_unit");

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
            <SelectItem value="mass" label="Peso (g, kg, mg)">Peso (g, kg, mg)</SelectItem>
            <SelectItem value="volume" label="Volumen (ml, cl, dl, l)">Volumen (ml, cl, dl, l)</SelectItem>
            <SelectItem value="unit" label="Unidad (u)">Unidad (u)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="default_calories">Calorias (kcal)</Label>
          <Input id="default_calories" type="number" step="any" min="0" {...register("default_calories")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="default_protein_grams">Proteinas (g)</Label>
          <Input id="default_protein_grams" type="number" step="any" min="0" {...register("default_protein_grams")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="default_carbs_grams">Carbohidratos (g)</Label>
          <Input id="default_carbs_grams" type="number" step="any" min="0" {...register("default_carbs_grams")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="default_fat_grams">Grasas (g)</Label>
          <Input id="default_fat_grams" type="number" step="any" min="0" {...register("default_fat_grams")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="default_fiber_grams">Fibra (g)</Label>
          <Input id="default_fiber_grams" type="number" step="any" min="0" {...register("default_fiber_grams")} />
        </div>
      </div>

      {/* Foto */}
      <div className="space-y-2">
        <Label>Foto</Label>
        <PhotoUpload photos={photo} onChange={(p) => setPhoto(p.slice(0, 1))} />
      </div>

      {/* Ingredientes */}
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
            onBlur={() => setTimeout(() => setIngredientFocused(false), 200)}
          />
          {ingredientFocused && filteredSuggestions.length > 0 && (
            <Card className="absolute z-50 w-full mt-1 max-h-40 overflow-y-auto">
              <CardContent className="p-1">
                {filteredSuggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="w-full text-left px-2 py-1 rounded hover:bg-muted text-sm"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      addIngredient(s.name);
                      ingredientRef.current?.focus();
                    }}
                  >
                    {s.name}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <TagInput
          value={tags}
          onChange={setTags}
          suggestions={tagSuggestions ?? []}
          placeholder="Agregar tag..."
        />
      </div>

      {/* Porciones */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Porciones</Label>
          <Button type="button" variant="ghost" size="sm" onClick={handleAddPortion}>
            <Plus className="size-4 mr-1" />
            Agregar
          </Button>
        </div>
        {portions.length > 0 ? (
          <div className="space-y-2">
            {portions.map((portion, index) => (
              <Card key={index}>
                <CardContent className="p-2">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Nombre (ej: taza, porcion)"
                      value={portion.name}
                      onChange={(e) => handlePortionChange(index, "name", e.target.value)}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground shrink-0">=</span>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Cantidad"
                      value={portion.base_equivalent}
                      onChange={(e) => handlePortionChange(index, "base_equivalent", e.target.value)}
                      className="w-24"
                    />
                    <span className="text-sm font-medium shrink-0">{baseUnit}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      onClick={() => handleRemovePortion(index)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Sin porciones. Ej: 1 taza = 240 ml
          </p>
        )}
      </div>

      {/* Conversiones */}
      <div className="space-y-3">
        <Label>Conversiones</Label>
        {(measurementType === "mass" || measurementType === "volume") && (
          <Card>
            <CardContent className="p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Densidad (g/ml)
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">1 ml =</span>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Ej: 0.92"
                  value={gramsPerMl}
                  onChange={(e) => setGramsPerMl(e.target.value)}
                  className="flex-1"
                />
                <span className="text-sm font-medium shrink-0">g</span>
              </div>
              <Input
                placeholder="Nota (ej: leche entera)"
                value={volumeNote}
                onChange={(e) => setVolumeNote(e.target.value)}
              />
            </CardContent>
          </Card>
        )}
        {measurementType === "unit" && (
          <Card>
            <CardContent className="p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Equivalencia por unidad
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">1 u =</span>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Ej: 50"
                  value={unitBaseEquivalent}
                  onChange={(e) => setUnitBaseEquivalent(e.target.value)}
                  className="flex-1"
                />
                <span className="text-sm font-medium shrink-0">g</span>
              </div>
              <Input
                placeholder="Nota (ej: huevo mediano)"
                value={unitNote}
                onChange={(e) => setUnitNote(e.target.value)}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Guardando..." : defaultValues ? "Guardar cambios" : "Crear alimento"}
      </Button>
    </form>
  );
}
