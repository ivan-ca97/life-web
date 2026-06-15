"use client";

import { useFood } from "@/lib/hooks/use-foods";
import { fmtCal, fmtGrams } from "@/lib/format";
import { MacroBar } from "@/components/macro-bar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const MEASUREMENT_LABELS: Record<string, string> = {
  mass: "Peso",
  volume: "Volumen",
  unit: "Unidad",
};

interface FoodDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  foodId: string;
}

export function FoodDetailDialog({ open, onOpenChange, foodId }: FoodDetailDialogProps) {
  const { data: food, isLoading } = useFood(foodId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {isLoading || !food ? (
          <>
            <DialogHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-24" />
            </DialogHeader>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </>
        ) : (
          <>
            {food.photo_url && (
              <img
                src={food.photo_url}
                alt=""
                className="w-full rounded-md object-cover max-h-56 -mt-2"
              />
            )}
            <DialogHeader>
              <DialogTitle>{food.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <Badge variant="outline">
                  {MEASUREMENT_LABELS[food.measurement_type] ?? food.measurement_type}
                </Badge>
                <span>
                  {food.base_quantity} {food.base_unit}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Macros */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Macros</h4>
                <div className="grid grid-cols-5 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Calorias</span>
                    <p className="font-medium">
                      {food.default_calories != null ? `${fmtCal(food.default_calories)}` : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Prot (g)</span>
                    <p className="font-medium">
                      {food.default_protein_grams != null ? fmtGrams(food.default_protein_grams) : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Carbs (g)</span>
                    <p className="font-medium">
                      {food.default_carbs_grams != null ? fmtGrams(food.default_carbs_grams) : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Grasa (g)</span>
                    <p className="font-medium">
                      {food.default_fat_grams != null ? fmtGrams(food.default_fat_grams) : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Fibra (g)</span>
                    <p className="font-medium">
                      {food.default_fiber_grams != null ? fmtGrams(food.default_fiber_grams) : "—"}
                    </p>
                  </div>
                </div>
                <MacroBar
                  protein={food.default_protein_grams ?? 0}
                  carbs={food.default_carbs_grams ?? 0}
                  fat={food.default_fat_grams ?? 0}
                />
              </div>

              {/* Ingredientes */}
              {food.ingredients.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-sm font-medium">Ingredientes</h4>
                  <div className="flex flex-wrap gap-1">
                    {food.ingredients.map((ing) => (
                      <Badge key={ing.id} variant="outline">
                        {ing.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {food.tags.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-sm font-medium">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {food.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Porciones */}
              {food.portions.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-sm font-medium">Porciones</h4>
                  <ul className="space-y-1 text-sm">
                    {food.portions.map((p) => (
                      <li key={p.id} className="text-muted-foreground">
                        1 {p.name} = {p.base_equivalent} {food.base_unit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Conversiones */}
              {(food.volume_conversion || food.unit_conversion) && (
                <div className="space-y-1.5">
                  <h4 className="text-sm font-medium">Conversiones</h4>
                  <ul className="space-y-1 text-sm">
                    {food.volume_conversion && (
                      <li className="flex items-center gap-1.5 text-muted-foreground">
                        <span>1 ml = {food.volume_conversion.grams_per_ml} g</span>
                        {food.volume_conversion.note && (
                          <span className="text-xs italic">({food.volume_conversion.note})</span>
                        )}
                      </li>
                    )}
                    {food.unit_conversion && (
                      <li className="flex items-center gap-1.5 text-muted-foreground">
                        <span>1 u = {food.unit_conversion.base_equivalent} {food.base_unit}</span>
                        {food.unit_conversion.note && (
                          <span className="text-xs italic">({food.unit_conversion.note})</span>
                        )}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
