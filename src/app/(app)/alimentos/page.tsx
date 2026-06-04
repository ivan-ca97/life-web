"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { useFoods, useDeleteFood } from "@/lib/hooks/use-foods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PaginationControls } from "@/components/pagination-controls";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { ListSkeleton } from "@/components/loading-skeleton";
import { FoodFormSheet } from "@/components/food-form-sheet";
import { FoodDetailDialog } from "@/components/food-detail-dialog";
import { fmtCal, fmtGrams } from "@/lib/format";

const MEASUREMENT_LABELS: Record<string, string> = {
  mass: "Peso",
  volume: "Volumen",
  unit: "Unidad",
};

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

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Alimento eliminado"),
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Alimentos</h1>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus className="size-4 mr-1" />
          Nuevo
        </Button>
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
                <div key={food.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="font-medium hover:underline text-left"
                        onClick={() => setViewingFoodId(food.id)}
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
                      onClick={() => setViewingFoodId(food.id)}
                    >
                      <Eye className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setEditingFoodId(food.id);
                        setSheetOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <Trash2 className="size-4" />
                        </Button>
                      }
                      title="Eliminar alimento"
                      description={`Se eliminara "${food.name}" permanentemente.`}
                      onConfirm={() => handleDelete(food.id)}
                      destructive
                    />
                  </div>
                </div>
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
    </div>
  );
}
