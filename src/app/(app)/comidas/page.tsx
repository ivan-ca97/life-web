"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useDate } from "@/lib/date/context";
import { Plus, Pencil, Trash2, Eye, Flame, Beef, Wheat, Droplets, Leaf, ImageIcon, ListTree } from "lucide-react";
import { toast } from "sonner";
import { useMeals, useDeleteMeal } from "@/lib/hooks/use-meals";
import { useDailySummary } from "@/lib/hooks/use-daily-summary";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PaginationControls } from "@/components/pagination-controls";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { ListSkeleton } from "@/components/loading-skeleton";
import { MealFormSheet } from "@/components/meal-form-sheet";
import { MealDetailDialog } from "@/components/meal-detail-dialog";
import { MealEditSheet } from "@/components/meal-edit-sheet";
import { DailyBreakdownDialog } from "@/components/daily-breakdown-dialog";
import { SummaryCard } from "@/components/summary-card";
import { MacroBar } from "@/components/macro-bar";
import { fmtCal, fmtGrams } from "@/lib/format";

export default function ComidasPage() {
  const { date } = useDate();
  const [offset, setOffset] = useState(0);

  useEffect(() => { setOffset(0); }, [date]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewingMealId, setViewingMealId] = useState<string | undefined>();
  const [editingMealId, setEditingMealId] = useState<string | undefined>();
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const limit = 20;

  const { data, isLoading } = useMeals({ date, limit, offset });
  const { data: summary } = useDailySummary(date);
  const deleteMutation = useDeleteMeal();

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Comida eliminada"),
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Comidas</h1>
        {!summary?.closed && (
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="size-4 mr-1" />
            Nueva
          </Button>
        )}
      </div>

      {summary && summary.meals.count > 0 && summary.meals.count > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => setBreakdownOpen(true)}
        >
          <ListTree className="size-4" />
          Desglose del dia
        </Button>
      )}

      {summary && summary.meals.count > 0 && (
        <button
          type="button"
          className="w-full text-left space-y-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setBreakdownOpen(true)}
        >
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            <SummaryCard
              icon={<Flame className="size-5" />}
              label="Calorias"
              value={fmtCal(summary.meals.total_calories)}
              unit="kcal"
            />
            <SummaryCard
              icon={<Beef className="size-5" />}
              label="Proteinas"
              value={fmtGrams(summary.meals.total_protein_grams)}
              unit="g"
            />
            <SummaryCard
              icon={<Wheat className="size-5" />}
              label="Carbohidratos"
              value={fmtGrams(summary.meals.total_carbs_grams)}
              unit="g"
            />
            <SummaryCard
              icon={<Droplets className="size-5" />}
              label="Grasas"
              value={fmtGrams(summary.meals.total_fat_grams)}
              unit="g"
            />
            <SummaryCard
              icon={<Leaf className="size-5" />}
              label="Fibra"
              value={fmtGrams(summary.meals.total_fiber_grams)}
              unit="g"
            />
          </div>
          <MacroBar
            protein={summary.meals.total_protein_grams}
            carbs={summary.meals.total_carbs_grams}
            fat={summary.meals.total_fat_grams}
          />
        </button>
      )}

      {isLoading ? (
        <ListSkeleton count={3} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          message="No hay comidas para esta fecha"
          action={{ label: "Registrar comida", onClick: () => setSheetOpen(true) }}
        />
      ) : (
        <>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {(() => {
                const anyHasPhotos = data.items.some((m) => m.photos.length > 0);
                return data.items.map((meal) => {
                  const primaryPhoto = meal.photos.find((p) => p.is_primary) ?? meal.photos[0];
                  return (
                <div key={meal.id} className="flex items-center gap-4 px-4 py-3">
                  {anyHasPhotos && (
                    primaryPhoto ? (
                      <div className="size-16 shrink-0 rounded-md overflow-hidden">
                        <img src={primaryPhoto.url} alt="" className="size-full object-cover" />
                      </div>
                    ) : (
                      <div className="size-16 shrink-0" />
                    )
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{meal.type}</Badge>
                      {meal.eaten_at && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {meal.eaten_at.slice(11, 16)}
                          {meal.eaten_at.slice(0, 10) !== meal.date && (
                            <span className="ml-0.5 text-[10px] align-super opacity-60">+1d</span>
                          )}
                        </span>
                      )}
                      <span className="font-medium">{meal.name}</span>
                      {meal.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                    {meal.items.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">
                        {meal.items.map((i) => i.food_name).join(", ")}
                      </p>
                    )}
                    {meal.calories != null && (
                      <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                        {fmtCal(meal.calories)} kcal
                        {meal.protein_grams != null && ` · ${fmtGrams(meal.protein_grams)}g prot`}
                        {meal.carbs_grams != null && ` · ${fmtGrams(meal.carbs_grams)}g carbs`}
                        {meal.fat_grams != null && ` · ${fmtGrams(meal.fat_grams)}g grasa`}
                        {meal.fiber_grams != null && ` · ${fmtGrams(meal.fiber_grams)}g fibra`}
                      </p>
                    )}
                    {(meal.protein_grams != null || meal.carbs_grams != null || meal.fat_grams != null) && (
                      <div className="mt-1">
                        <MacroBar
                          protein={meal.protein_grams ?? 0}
                          carbs={meal.carbs_grams ?? 0}
                          fat={meal.fat_grams ?? 0}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon-sm" onClick={() => setViewingMealId(meal.id)}>
                      <Eye className="size-4" />
                    </Button>
                    {!summary?.closed && (
                      <>
                        <Button variant="ghost" size="icon-sm" onClick={() => setEditingMealId(meal.id)}>
                          <Pencil className="size-4" />
                        </Button>
                        <ConfirmDialog
                          trigger={
                            <Button variant="ghost" size="icon-sm">
                              <Trash2 className="size-4" />
                            </Button>
                          }
                          title="Eliminar comida"
                          description={`Se eliminara "${meal.name}" permanentemente.`}
                          onConfirm={() => handleDelete(meal.id)}
                          destructive
                        />
                      </>
                    )}
                  </div>
                </div>
                  );
                });
              })()}
            </CardContent>
          </Card>
          <PaginationControls
            total={data.total}
            limit={data.limit}
            offset={offset}
            onPageChange={setOffset}
          />
        </>
      )}
      <MealFormSheet open={sheetOpen} onOpenChange={setSheetOpen} />
      {viewingMealId && (
        <MealDetailDialog
          open={!!viewingMealId}
          onOpenChange={(open) => { if (!open) setViewingMealId(undefined); }}
          mealId={viewingMealId}
        />
      )}
      <DailyBreakdownDialog open={breakdownOpen} onOpenChange={setBreakdownOpen} date={date} />
      {editingMealId && (
        <MealEditSheet
          open={!!editingMealId}
          onOpenChange={(open) => { if (!open) setEditingMealId(undefined); }}
          mealId={editingMealId}
        />
      )}
    </div>
  );
}
