"use client";

import { useState } from "react";
import { DndContext, DragOverlay, type DragStartEvent, type DragEndEvent } from "@dnd-kit/core";
import { Plus, Search, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { useFoods, useDeleteFood } from "@/lib/hooks/use-foods";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { PaginationControls } from "@/components/pagination-controls";
import { EmptyState } from "@/components/empty-state";
import { ListSkeleton } from "@/components/loading-skeleton";
import { FoodFormSheet } from "@/components/food-form-sheet";
import { FoodDetailDialog } from "@/components/food-detail-dialog";
import { DraggableFoodRow } from "@/components/meal-builder/draggable-food-row";
import { MealBuilderPanel } from "@/components/meal-builder/meal-builder-panel";
import { useMealBuilder } from "@/components/meal-builder/use-meal-builder";
import { fmtCal } from "@/lib/format";
import type { Food } from "@/lib/types/food";

export default function AlimentosPage() {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [offset, setOffset] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState<string>();
  const [viewingFoodId, setViewingFoodId] = useState<string>();
  const limit = 20;

  const { data, isLoading } = useFoods({ q: query, tag, limit, offset });
  const deleteMutation = useDeleteFood();
  const builder = useMealBuilder();
  const isMobile = useIsMobile();
  const [activeDragFood, setActiveDragFood] = useState<Food | null>(null);

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Alimento eliminado"),
      onError: (err) => toast.error(err.message),
    });
  }

  function handleAddToBuilder(food: Food) {
    if (!builder.open) builder.setOpen(true);
    builder.addFood(food);
  }

  function handleDragStart(event: DragStartEvent) {
    const food = event.active.data.current?.food as Food | undefined;
    if (food) {
      setActiveDragFood(food);
      if (!builder.open) builder.setOpen(true);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragFood(null);
    if (event.over?.id === "meal-builder-drop") {
      const food = event.active.data.current?.food as Food | undefined;
      if (food) {
        builder.addFood(food);
      }
    }
  }

  const builderPanel = (
    <MealBuilderPanel
      items={builder.items}
      onRemoveItem={builder.removeItem}
      onUpdateItem={builder.updateItem}
      onClear={builder.clearItems}
      onClose={() => builder.setOpen(false)}
      allValid={builder.allValid}
      preview={builder.preview}
      previewLoading={builder.previewLoading}
      onSave={builder.saveMeal}
      isSaving={builder.isSaving}
      isDragActive={!!activeDragFood}
    />
  );

  const foodList = (
    <div className="flex-1 min-w-0 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Alimentos</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => builder.setOpen(true)}>
            <UtensilsCrossed className="size-4 mr-1" />
            Nueva comida
          </Button>
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="size-4 mr-1" />
            Nuevo
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar alimentos..."
            className="pl-9"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOffset(0);
            }}
          />
        </div>
        <Input
          placeholder="Filtrar por tag"
          className="max-w-[200px]"
          value={tag}
          onChange={(e) => {
            setTag(e.target.value);
            setOffset(0);
          }}
        />
      </div>

      {isLoading ? (
        <ListSkeleton count={5} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          message="No hay alimentos registrados"
          action={{ label: "Crear alimento", onClick: () => setSheetOpen(true) }}
        />
      ) : (
        <>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {data.items.map((food) => (
                <DraggableFoodRow
                  key={food.id}
                  food={food}
                  isInBuilder={builder.foodIdsInBuilder.has(food.id)}
                  onAddToBuilder={handleAddToBuilder}
                  onView={(id) => setViewingFoodId(id)}
                  onEdit={(id) => {
                    setEditingFoodId(id);
                    setSheetOpen(true);
                  }}
                  onDelete={handleDelete}
                />
              ))}
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
    </div>
  );

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-6">
        {/* Builder panel - desktop: left column */}
        {builder.open && !isMobile && (
          <div className="w-[380px] shrink-0 sticky top-0 self-start max-h-[calc(100vh-3.5rem-3rem)] overflow-y-auto">
            {builderPanel}
          </div>
        )}

        {/* Food list - takes remaining space */}
        {foodList}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeDragFood && (
          <div className="rounded-lg border bg-background px-4 py-2 shadow-lg">
            <span className="font-medium text-sm">{activeDragFood.name}</span>
            {activeDragFood.default_calories != null && (
              <Badge variant="outline" className="ml-2 text-xs">
                {fmtCal(activeDragFood.default_calories)} kcal
              </Badge>
            )}
          </div>
        )}
      </DragOverlay>

      {/* Builder panel - mobile: bottom sheet */}
      {isMobile && (
        <Sheet open={builder.open} onOpenChange={builder.setOpen}>
          <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
            {builderPanel}
          </SheetContent>
        </Sheet>
      )}

      {/* Existing sheets/dialogs */}
      <FoodFormSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingFoodId(undefined);
        }}
        foodId={editingFoodId}
      />
      {viewingFoodId && (
        <FoodDetailDialog
          open={!!viewingFoodId}
          onOpenChange={(open) => {
            if (!open) setViewingFoodId(undefined);
          }}
          foodId={viewingFoodId}
        />
      )}
    </DndContext>
  );
}
