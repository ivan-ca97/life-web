"use client";

import { useDraggable } from "@dnd-kit/core";
import { Plus, Check, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { fmtCal, fmtGrams } from "@/lib/format";
import type { Food } from "@/lib/types/food";

const MEASUREMENT_LABELS: Record<string, string> = {
  mass: "Peso",
  volume: "Volumen",
  unit: "Unidad",
};

interface DraggableFoodRowProps {
  food: Food;
  isInBuilder: boolean;
  onAddToBuilder: (food: Food) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function DraggableFoodRow({
  food,
  isInBuilder,
  onAddToBuilder,
  onView,
  onEdit,
  onDelete,
}: DraggableFoodRowProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: food.id,
    data: { food },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-4 px-4 py-3 touch-none ${
        isDragging ? "opacity-30" : isInBuilder ? "opacity-50" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="font-medium hover:underline text-left"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onView(food.id)}
          >
            {food.name}
          </button>
          {food.measurement_type && (
            <Badge variant="outline" className="text-xs">
              {MEASUREMENT_LABELS[food.measurement_type] ?? food.measurement_type}
            </Badge>
          )}
          {food.tags.map((t) => (
            <Badge key={t} variant="secondary" className="text-xs">
              {t}
            </Badge>
          ))}
        </div>
        {(food.default_calories != null || food.base_quantity != null) && (
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            {food.base_quantity != null &&
              `${food.base_quantity}${food.base_unit ? ` ${food.base_unit}` : ""}`}
            {food.base_quantity != null && food.default_calories != null && " · "}
            {food.default_calories != null && `${fmtCal(food.default_calories)} kcal`}
            {food.default_protein_grams != null &&
              ` · ${fmtGrams(food.default_protein_grams)}g prot`}
            {food.default_carbs_grams != null &&
              ` · ${fmtGrams(food.default_carbs_grams)}g carbs`}
            {food.default_fat_grams != null &&
              ` · ${fmtGrams(food.default_fat_grams)}g grasa`}
          </p>
        )}
      </div>
      <div className="flex gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={isInBuilder}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onAddToBuilder(food)}
        >
          {isInBuilder ? (
            <Check className="size-4 text-muted-foreground" />
          ) : (
            <Plus className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onView(food.id)}
        >
          <Eye className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onEdit(food.id)}
        >
          <Pencil className="size-4" />
        </Button>
        <ConfirmDialog
          trigger={
            <Button
              variant="ghost"
              size="icon-sm"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Trash2 className="size-4" />
            </Button>
          }
          title="Eliminar alimento"
          description={`Se eliminara "${food.name}" permanentemente.`}
          onConfirm={() => onDelete(food.id)}
          destructive
        />
      </div>
    </div>
  );
}
