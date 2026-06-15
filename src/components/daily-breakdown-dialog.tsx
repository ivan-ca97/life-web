"use client";

import { useState, useMemo } from "react";
import { Code, BarChart3, Copy, Check } from "lucide-react";
import { useMeals } from "@/lib/hooks/use-meals";
import { fmtCal, fmtGrams } from "@/lib/format";
import { getMethodMeta } from "@/lib/measurement-method";
import { MacroBar } from "@/components/macro-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Meal, MealItem } from "@/lib/types/meal";

interface DailyBreakdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
}

interface FlatItem extends MealItem {
  meal_type: string;
  meal_name: string;
}

export function DailyBreakdownDialog({ open, onOpenChange, date }: DailyBreakdownDialogProps) {
  const { data, isLoading } = useMeals({ date, limit: 100, offset: 0 });
  const meals: Meal[] = data?.items ?? [];
  const [view, setView] = useState<"visual" | "json">("visual");
  const [copied, setCopied] = useState(false);

  const allItems = useMemo(() => {
    const flat: FlatItem[] = [];
    for (const meal of meals) {
      for (const item of meal.items) {
        flat.push({ ...item, meal_type: meal.type, meal_name: meal.name });
      }
    }
    return flat.sort((a, b) => (b.calories ?? 0) - (a.calories ?? 0));
  }, [meals]);

  const totals = useMemo(() => {
    let cal = 0, prot = 0, carbs = 0, fat = 0, fiber = 0;
    for (const i of allItems) {
      cal += i.calories ?? 0;
      prot += i.protein_grams ?? 0;
      carbs += i.carbs_grams ?? 0;
      fat += i.fat_grams ?? 0;
      fiber += i.fiber_grams ?? 0;
    }
    return { cal, prot, carbs, fat, fiber };
  }, [allItems]);

  const jsonData = useMemo(() => {
    return JSON.stringify({
      date,
      totals: {
        calories: Math.round(totals.cal),
        protein_grams: Math.round(totals.prot * 10) / 10,
        carbs_grams: Math.round(totals.carbs * 10) / 10,
        fat_grams: Math.round(totals.fat * 10) / 10,
        fiber_grams: Math.round(totals.fiber * 10) / 10,
      },
      meals: meals.map((m) => ({
        type: m.type,
        name: m.name || undefined,
        eaten_at: m.eaten_at || undefined,
        calories: m.calories,
        protein_grams: m.protein_grams,
        carbs_grams: m.carbs_grams,
        fat_grams: m.fat_grams,
        fiber_grams: m.fiber_grams,
        items: m.items.map((i) => ({
          food_name: i.food_name,
          quantity: i.input_quantity,
          unit: i.input_unit,
          measurement_method: i.measurement_method || undefined,
          calories: i.calories,
          protein_grams: i.protein_grams,
          carbs_grams: i.carbs_grams,
          fat_grams: i.fat_grams,
          fiber_grams: i.fiber_grams,
        })),
      })),
    }, null, 2);
  }, [date, totals, meals]);

  function handleCopy() {
    navigator.clipboard.writeText(jsonData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        {isLoading ? (
          <>
            <DialogHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
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
              <DialogTitle>Desglose del dia</DialogTitle>
              <DialogDescription className="flex items-center justify-between">
                <span>{date} — {allItems.length} alimentos en {meals.length} comidas</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs gap-1 text-muted-foreground"
                  onClick={() => setView(view === "visual" ? "json" : "visual")}
                >
                  {view === "visual" ? <><Code className="size-3.5" /> JSON</> : <><BarChart3 className="size-3.5" /> Visual</>}
                </Button>
              </DialogDescription>
            </DialogHeader>

            {view === "json" ? (
              <div className="overflow-y-auto min-h-0 space-y-2">
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCopy}>
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                </div>
                <pre className="text-xs bg-muted/50 rounded-md p-3 overflow-x-auto whitespace-pre">
                  {jsonData}
                </pre>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto min-h-0 scrollbar-none">
                {/* Totals */}
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">Calorias</span>
                      <p className="font-medium">{fmtCal(totals.cal)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Prot (g)</span>
                      <p className="font-medium">{fmtGrams(totals.prot)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Carbs (g)</span>
                      <p className="font-medium">{fmtGrams(totals.carbs)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Grasa (g)</span>
                      <p className="font-medium">{fmtGrams(totals.fat)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Fibra (g)</span>
                      <p className="font-medium">{fmtGrams(totals.fiber)}</p>
                    </div>
                  </div>
                  <MacroBar protein={totals.prot} carbs={totals.carbs} fat={totals.fat} />
                </div>

                {/* All items sorted by calories */}
                {allItems.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-medium">Todos los alimentos</h4>
                    <div className="space-y-2">
                      {allItems.map((item) => {
                        const method = getMethodMeta(item.measurement_method);
                        return (
                          <div key={item.id} className="text-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-medium truncate">{item.food_name}</span>
                                {method && (
                                  <span className={`text-[10px] shrink-0 ${method.color}`} title={method.label}>
                                    {method.shortLabel}
                                  </span>
                                )}
                                <Badge variant="outline" className="text-[10px] shrink-0">
                                  {item.meal_type}
                                </Badge>
                              </div>
                              <span className="text-muted-foreground text-xs shrink-0 ml-2">
                                {item.input_quantity} {item.input_unit}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {[
                                item.calories != null && `${fmtCal(item.calories)} kcal`,
                                item.protein_grams != null && `${fmtGrams(item.protein_grams)}g prot`,
                                item.carbs_grams != null && `${fmtGrams(item.carbs_grams)}g carbs`,
                                item.fat_grams != null && `${fmtGrams(item.fat_grams)}g grasa`,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Per-meal subtotals */}
                {meals.length > 1 && (
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-medium">Por comida</h4>
                    <div className="space-y-1">
                      {[...meals]
                        .sort((a, b) => (b.calories ?? 0) - (a.calories ?? 0))
                        .map((meal) => (
                          <div key={meal.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-xs">{meal.type}</Badge>
                              {meal.name && <span className="text-muted-foreground">{meal.name}</span>}
                            </div>
                            <span className="text-muted-foreground text-xs tabular-nums">
                              {fmtCal(meal.calories ?? 0)} kcal · {fmtGrams(meal.protein_grams ?? 0)}g P · {fmtGrams(meal.carbs_grams ?? 0)}g C · {fmtGrams(meal.fat_grams ?? 0)}g G
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {allItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin alimentos registrados para este dia
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
