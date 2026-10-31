"use client";

import { useState } from "react";
import { Search, Globe, Eye, Check, X } from "lucide-react";
import { useCommunityFoods } from "@/lib/hooks/use-foods";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PaginationControls } from "@/components/pagination-controls";
import { EmptyState } from "@/components/empty-state";
import { ListSkeleton } from "@/components/loading-skeleton";
import { FoodDetailDialog } from "@/components/food-detail-dialog";
import { fmtCal, fmtGrams } from "@/lib/format";
import type { Food } from "@/lib/types/food";

const MEASUREMENT_LABELS: Record<string, string> = {
  mass: "Peso",
  volume: "Volumen",
};

export default function ComunidadPage() {
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [viewingFood, setViewingFood] = useState<Food | null>(null);
  const limit = 20;

  const { userId } = useAuth();
  const { data, isLoading } = useCommunityFoods({ q: query, limit, offset });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Globe className="size-6" />
        <h1 className="text-2xl font-semibold">Comunidad</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Alimentos publicos de todos los usuarios. Podes usarlos directamente en tus comidas.
      </p>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en la comunidad..."
            className="pl-9"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOffset(0);
            }}
          />
        </div>
        {query && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setQuery(""); setOffset(0); }}
            title="Limpiar busqueda"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {isLoading ? (
        <ListSkeleton count={5} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState message="No hay alimentos publicos todavia" />
      ) : (
        <>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {data.items.map((food) => {
                const isOwn = userId != null && food.user_id === userId;
                return (
                  <div key={food.id} className="flex items-center gap-4 px-4 py-3">
                    {food.photo_url && (
                      <img
                        src={food.photo_url}
                        alt=""
                        className="size-10 rounded-md object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="font-medium hover:underline text-left"
                          onClick={() => setViewingFood(food)}
                        >
                          {food.name}
                        </button>
                        <Badge variant="outline" className="text-xs">
                          {MEASUREMENT_LABELS[food.measurement_type] ?? food.measurement_type}
                        </Badge>
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
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setViewingFood(food)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      {isOwn && (
                        <Badge variant="outline" className="gap-1">
                          <Check className="size-3" />
                          Tuyo
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
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

      {viewingFood && (
        <FoodDetailDialog
          open={!!viewingFood}
          onOpenChange={(open) => {
            if (!open) setViewingFood(null);
          }}
          food={viewingFood}
        />
      )}
    </div>
  );
}
