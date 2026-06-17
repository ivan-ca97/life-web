"use client";

import { use, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Star, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useMeal, useDeleteMeal } from "@/lib/hooks/use-meals";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MacroBar } from "@/components/macro-bar";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { MealEditSheet } from "@/components/meal-edit-sheet";
import { CardSkeleton } from "@/components/loading-skeleton";
import { fmtCal, fmtGrams } from "@/lib/format";
import { getMethodMeta } from "@/lib/measurement-method";
import { PannableImage } from "@/components/pannable-image";
import type { MealPhoto } from "@/lib/types/meal";

export default function ComidaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: meal, isLoading } = useMeal(id);
  const deleteMutation = useDeleteMeal();
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const photoToItems = useMemo(() => {
    if (!meal) return new Map<string, string[]>();
    const map = new Map<string, string[]>();
    for (const p of meal.photos) {
      if (p.meal_item_id) {
        const ids = map.get(p.url) || [];
        if (!ids.includes(p.meal_item_id)) map.set(p.url, [...ids, p.meal_item_id]);
      }
    }
    return map;
  }, [meal]);

  const itemToPhotos = useMemo(() => {
    if (!meal) return new Map<string, MealPhoto[]>();
    const map = new Map<string, MealPhoto[]>();
    for (const p of meal.photos) {
      if (p.meal_item_id) {
        const photos = map.get(p.meal_item_id) || [];
        if (!photos.some((x) => x.url === p.url)) map.set(p.meal_item_id, [...photos, p]);
      }
    }
    return map;
  }, [meal]);

  const highlightedItemIds = useMemo(() => {
    if (!selectedPhotoUrl) return new Set<string>();
    return new Set(photoToItems.get(selectedPhotoUrl) || []);
  }, [selectedPhotoUrl, photoToItems]);

  const galleryPhotos = useMemo(() => {
    if (!meal) return [];
    const seen = new Map<string, MealPhoto>();
    for (const p of meal.photos) {
      if (!seen.has(p.url) || (!p.meal_item_id && seen.get(p.url)?.meal_item_id)) {
        seen.set(p.url, p);
      }
    }
    return Array.from(seen.values());
  }, [meal]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!meal) {
    return <p className="text-muted-foreground">Comida no encontrada</p>;
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline">{meal.type}</Badge>
            <span className="text-sm text-muted-foreground">{meal.date}</span>
          </div>
          <h1 className="text-2xl font-semibold">{meal.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4 mr-1" />
              Editar
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="outline">
                <Trash2 className="size-4 mr-1" />
                Eliminar
              </Button>
            }
            title="Eliminar comida"
            description={meal.name ? `Se eliminara "${meal.name}" permanentemente.` : "Se eliminara la comida permanentemente."}
            onConfirm={() => {
              deleteMutation.mutate(meal.id, {
                onSuccess: () => {
                  toast.success("Comida eliminada");
                  router.push("/comidas");
                },
                onError: (err) => toast.error(err.message),
              });
            }}
            destructive
          />
        </div>
      </div>

      {meal.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {meal.tags.map((t) => (
            <Badge key={t} variant="secondary">{t}</Badge>
          ))}
        </div>
      )}

      {galleryPhotos.length > 0 && (
        <DetailPhotoGallery
          photos={galleryPhotos}
          photoToItems={photoToItems}
          onPhotoSelect={setSelectedPhotoUrl}
        />
      )}

      {meal.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...meal.items].sort((a, b) => (b.calories ?? 0) - (a.calories ?? 0)).map((item) => {
                const method = getMethodMeta(item.measurement_method);
                const photos = itemToPhotos.get(item.id);
                const isHighlighted = highlightedItemIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`text-sm space-y-1.5 transition-colors duration-200 ${
                      isHighlighted ? "bg-primary/10 rounded-md px-2 py-1.5 -mx-2" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{item.food_name}</span>
                        {method && (
                          <span className={`text-[10px] ${method.color}`} title={method.label}>
                            {method.shortLabel}
                          </span>
                        )}
                        {photos && <ImageIcon className="size-3 text-muted-foreground" />}
                      </div>
                      <span className="text-muted-foreground">
                        {item.input_quantity} {item.input_unit}
                        {item.input_unit !== item.normalized_unit &&
                          ` (${item.normalized_quantity} ${item.normalized_unit})`}
                      </span>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      {item.calories != null && <span>{fmtCal(item.calories)} kcal</span>}
                      {item.protein_grams != null && <span>{fmtGrams(item.protein_grams)}g prot</span>}
                      {item.carbs_grams != null && <span>{fmtGrams(item.carbs_grams)}g carbs</span>}
                      {item.fat_grams != null && <span>{fmtGrams(item.fat_grams)}g grasa</span>}
                      {item.fiber_grams != null && <span>{fmtGrams(item.fiber_grams)}g fibra</span>}
                      {item.notes && <span>— {item.notes}</span>}
                    </div>
                    {photos && photos.length > 0 && (
                      <div className="flex gap-1.5 pt-0.5">
                        {photos.map((p) => (
                          <div key={p.id} className="relative size-14 rounded overflow-hidden border">
                            <img src={p.url} alt="" className="size-full object-cover" />
                            {p.is_primary && (
                              <Star className="absolute top-0.5 left-0.5 size-3 fill-yellow-400 text-yellow-400" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {(meal.calories != null || meal.protein_grams != null) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Macros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {meal.calories != null && (
                <div>
                  <span className="text-muted-foreground">Calorias:</span>{" "}
                  {fmtCal(meal.calories)} kcal
                </div>
              )}
              {meal.protein_grams != null && (
                <div>
                  <span className="text-muted-foreground">Proteinas:</span>{" "}
                  {fmtGrams(meal.protein_grams)}g
                </div>
              )}
              {meal.carbs_grams != null && (
                <div>
                  <span className="text-muted-foreground">Carbohidratos:</span>{" "}
                  {fmtGrams(meal.carbs_grams)}g
                </div>
              )}
              {meal.fat_grams != null && (
                <div>
                  <span className="text-muted-foreground">Grasas:</span>{" "}
                  {fmtGrams(meal.fat_grams)}g
                </div>
              )}
              {meal.fiber_grams != null && (
                <div>
                  <span className="text-muted-foreground">Fibra:</span>{" "}
                  {fmtGrams(meal.fiber_grams)}g
                </div>
              )}
            </div>
            <MacroBar
              protein={meal.protein_grams ?? 0}
              carbs={meal.carbs_grams ?? 0}
              fat={meal.fat_grams ?? 0}
            />
          </CardContent>
        </Card>
      )}

      {meal.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{meal.notes}</p>
          </CardContent>
        </Card>
      )}

      <MealEditSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        mealId={meal.id}
      />
    </div>
  );
}

function DetailPhotoGallery({
  photos,
  photoToItems,
  onPhotoSelect,
}: {
  photos: MealPhoto[];
  photoToItems: Map<string, string[]>;
  onPhotoSelect: (url: string | null) => void;
}) {
  const [selected, setSelected] = useState(0);
  const primary = photos.find((p) => p.is_primary);
  const sorted = primary ? [primary, ...photos.filter((p) => p.id !== primary.id)] : photos;

  function handleSelect(index: number) {
    setSelected(index);
    const photo = sorted[index];
    onPhotoSelect(photoToItems.has(photo.url) ? photo.url : null);
  }

  if (sorted.length === 1) {
    return (
      <PannableImage
        src={sorted[0].url}
        className="w-full rounded-lg object-cover max-h-72"
        onClick={() => handleSelect(0)}
      />
    );
  }

  return (
    <div className="space-y-2">
      <PannableImage
        src={sorted[selected].url}
        className="w-full rounded-lg object-cover max-h-72"
      />
      <div className="flex gap-1.5 overflow-x-auto">
        {sorted.map((photo, i) => {
          const hasItems = photoToItems.has(photo.url);
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => handleSelect(i)}
              className={`relative size-14 shrink-0 rounded-md overflow-hidden border-2 transition-colors ${
                i === selected ? "border-primary" : "border-transparent"
              }`}
            >
              <img src={photo.url} alt="" className="size-full object-cover" />
              {photo.is_primary && (
                <Star className="absolute top-0.5 left-0.5 size-3 fill-yellow-400 text-yellow-400" />
              )}
              {hasItems && (
                <div className="absolute bottom-0.5 right-0.5 size-2 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
