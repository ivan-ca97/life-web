"use client";

import { useMeal } from "@/lib/hooks/use-meals";
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

interface MealDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealId: string;
}

export function MealDetailDialog({ open, onOpenChange, mealId }: MealDetailDialogProps) {
  const { data: meal, isLoading } = useMeal(mealId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {isLoading || !meal ? (
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
            <DialogHeader>
              <DialogTitle>{meal.name || meal.type}</DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <Badge variant="outline">{meal.type}</Badge>
                {meal.eaten_at && (
                  <span className="tabular-nums">
                    {meal.eaten_at.slice(11, 16)}
                    {meal.eaten_at.slice(0, 10) !== meal.date && (
                      <span className="ml-0.5 text-[10px] align-super opacity-60">+1d</span>
                    )}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Macros */}
              {(meal.calories != null || meal.protein_grams != null) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Macros</h4>
                  <div className="grid grid-cols-5 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">Calorias</span>
                      <p className="font-medium">
                        {meal.calories != null ? fmtCal(meal.calories) : "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Prot (g)</span>
                      <p className="font-medium">
                        {meal.protein_grams != null ? fmtGrams(meal.protein_grams) : "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Carbs (g)</span>
                      <p className="font-medium">
                        {meal.carbs_grams != null ? fmtGrams(meal.carbs_grams) : "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Grasa (g)</span>
                      <p className="font-medium">
                        {meal.fat_grams != null ? fmtGrams(meal.fat_grams) : "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Fibra (g)</span>
                      <p className="font-medium">
                        {meal.fiber_grams != null ? fmtGrams(meal.fiber_grams) : "—"}
                      </p>
                    </div>
                  </div>
                  <MacroBar
                    protein={meal.protein_grams ?? 0}
                    carbs={meal.carbs_grams ?? 0}
                    fat={meal.fat_grams ?? 0}
                  />
                </div>
              )}

              {/* Alimentos */}
              {meal.items.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-sm font-medium">Alimentos</h4>
                  <div className="space-y-2">
                    {meal.items.map((item) => (
                      <div key={item.id} className="text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.food_name}</span>
                          <span className="text-muted-foreground text-xs">
                            {item.input_quantity} {item.input_unit}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {[
                            item.calories != null && `${fmtCal(item.calories)} kcal`,
                            item.protein_grams != null && `${fmtGrams(item.protein_grams)}g prot`,
                            item.carbs_grams != null && `${fmtGrams(item.carbs_grams)}g carbs`,
                            item.fat_grams != null && `${fmtGrams(item.fat_grams)}g grasa`,
                          ].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {meal.tags.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-sm font-medium">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {meal.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas */}
              {meal.notes && (
                <div className="space-y-1.5">
                  <h4 className="text-sm font-medium">Notas</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{meal.notes}</p>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
