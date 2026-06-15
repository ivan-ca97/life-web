"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { X, ChevronDown, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MacroBar } from "@/components/macro-bar";
import { TagInput } from "@/components/tag-input";
import { PhotoUpload } from "@/components/photo-upload";
import { useDate } from "@/lib/date/context";
import { useMealTags } from "@/lib/hooks/use-tags";
import { fmtCal, fmtGrams } from "@/lib/format";
import { MEASUREMENT_METHODS, getMethodLabel } from "@/lib/measurement-method";
import type { BuilderItem, MealMeta } from "./use-meal-builder";
import type { MealPreviewResponse } from "@/lib/types/meal";
import type { UploadedPhoto } from "@/lib/hooks/use-media";

interface MealBuilderPanelProps {
  items: BuilderItem[];
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: keyof BuilderItem, value: string) => void;
  onClear: () => void;
  onClose: () => void;
  allValid: boolean;
  preview: MealPreviewResponse | undefined;
  previewLoading: boolean;
  onSave: (meta: MealMeta) => void;
  isSaving: boolean;
  isDragActive: boolean;
}

export function MealBuilderPanel({
  items,
  onRemoveItem,
  onUpdateItem,
  onClear,
  onClose,
  allValid,
  preview,
  previewLoading,
  onSave,
  isSaving,
  isDragActive,
}: MealBuilderPanelProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "meal-builder-drop" });
  const { date: globalDate } = useDate();
  const [type, setType] = useState("");
  const [name, setName] = useState("");
  const [eatenTime, setEatenTime] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [extraOpen, setExtraOpen] = useState(false);
  const [typeError, setTypeError] = useState("");
  const { data: tagSuggestions } = useMealTags();

  function handleSave() {
    if (!type.trim()) {
      setTypeError("El tipo es obligatorio");
      return;
    }
    setTypeError("");
    onSave({
      type: type.trim(),
      name: name.trim() || undefined,
      eaten_time: eatenTime || undefined,
      notes: notes.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      photos: photos.length > 0 ? photos : undefined,
    });
    setType("");
    setName("");
    setEatenTime("");
    setNotes("");
    setTags([]);
    setPhotos([]);
  }

  return (
    <div ref={setNodeRef} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Nueva comida</h2>
          <p className="text-xs text-muted-foreground">{globalDate}</p>
        </div>
        <div className="flex gap-1">
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              Limpiar
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Meal type - always visible */}
      <div className="space-y-1">
        <Label className="text-xs">Tipo de comida</Label>
        <Input
          placeholder="desayuno, almuerzo..."
          value={type}
          onChange={(e) => { setType(e.target.value); setTypeError(""); }}
        />
        {typeError && <p className="text-xs text-destructive">{typeError}</p>}
      </div>

      {/* Drop zone indicator */}
      {isDragActive && (
        <div
          className={`rounded-lg border-2 border-dashed p-4 text-center text-sm transition-colors ${
            isOver
              ? "border-primary bg-primary/10 text-primary"
              : "border-muted-foreground/30 text-muted-foreground"
          }`}
        >
          {isOver ? "Suelta para agregar" : "Arrastra alimentos aqui"}
        </div>
      )}

      {/* Items list */}
      {items.length === 0 && !isDragActive ? (
        <div className="flex flex-col items-center py-6 text-center text-muted-foreground">
          <Package className="size-8 mb-2 opacity-50" />
          <p className="text-sm">Arrastra alimentos o usa el boton +</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <Card key={`${item.food_id}-${index}`}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">{item.food_name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => onRemoveItem(index)}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Cantidad</Label>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      value={item.quantity}
                      className={Number(item.quantity) <= 0 ? "border-destructive" : ""}
                      onChange={(e) =>
                        onUpdateItem(index, "quantity", e.target.value.replace(/^0+(?=\d)/, ""))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Unidad</Label>
                    <Select
                      value={item.unit}
                      onValueChange={(v) => onUpdateItem(index, "unit", v ?? item.unit)}
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
                </div>
                <div>
                  <Label className="text-xs">Metodo</Label>
                  <Select
                    value={item.measurement_method}
                    onValueChange={(v) => onUpdateItem(index, "measurement_method", v ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="—">
                        {getMethodLabel(item.measurement_method) || "—"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" label="—">—</SelectItem>
                      {MEASUREMENT_METHODS.map((m) => (
                        <SelectItem key={m.value} value={m.value} label={m.label}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(() => {
                  const pi = preview?.items?.[index];
                  if (!pi) return null;
                  const parts: string[] = [];
                  if (pi.calories != null) parts.push(`${fmtCal(pi.calories)} kcal`);
                  if (pi.protein_grams != null) parts.push(`${fmtGrams(pi.protein_grams)}g prot`);
                  if (pi.carbs_grams != null) parts.push(`${fmtGrams(pi.carbs_grams)}g carbs`);
                  if (pi.fat_grams != null) parts.push(`${fmtGrams(pi.fat_grams)}g grasa`);
                  if (parts.length === 0) return null;
                  return <p className="text-xs text-muted-foreground">{parts.join(" · ")}</p>;
                })()}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Macro totals */}
      {items.length > 0 && preview && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Totales</Label>
            {previewLoading && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
          </div>
          <div className="grid grid-cols-5 gap-1 text-center text-xs tabular-nums">
            <div>
              <p className="text-muted-foreground">kcal</p>
              <p className="font-medium">{fmtCal(preview.calories)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">prot</p>
              <p className="font-medium">{fmtGrams(preview.protein_grams)}g</p>
            </div>
            <div>
              <p className="text-muted-foreground">carbs</p>
              <p className="font-medium">{fmtGrams(preview.carbs_grams)}g</p>
            </div>
            <div>
              <p className="text-muted-foreground">grasa</p>
              <p className="font-medium">{fmtGrams(preview.fat_grams)}g</p>
            </div>
            <div>
              <p className="text-muted-foreground">fibra</p>
              <p className="font-medium">{fmtGrams(preview.fiber_grams)}g</p>
            </div>
          </div>
          <MacroBar
            protein={preview.protein_grams ?? 0}
            carbs={preview.carbs_grams ?? 0}
            fat={preview.fat_grams ?? 0}
          />
        </div>
      )}

      {/* Extra options */}
      <div>
        <button
          type="button"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setExtraOpen(!extraOpen)}
        >
          <ChevronDown className={`size-4 transition-transform ${extraOpen ? "rotate-180" : ""}`} />
          Opciones adicionales
        </button>
        {extraOpen && (
          <div className="mt-3 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Hora</Label>
              <Input type="time" value={eatenTime} onChange={(e) => setEatenTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tags</Label>
              <TagInput value={tags} onChange={setTags} suggestions={tagSuggestions} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notas</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fotos</Label>
              <PhotoUpload photos={photos} onChange={setPhotos} />
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      <Button
        className="w-full"
        disabled={isSaving || !allValid}
        onClick={handleSave}
      >
        {isSaving ? "Guardando..." : "Guardar comida"}
      </Button>
    </div>
  );
}
