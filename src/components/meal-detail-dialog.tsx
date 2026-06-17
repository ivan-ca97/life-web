"use client";

import { useState, useMemo } from "react";
import { useMeal } from "@/lib/hooks/use-meals";
import { MealEditSheet } from "@/components/meal-edit-sheet";
import { fmtCal, fmtGrams } from "@/lib/format";
import { getMethodMeta } from "@/lib/measurement-method";
import { MacroBar } from "@/components/macro-bar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, ImageIcon, Pencil } from "lucide-react";
import { PannableImage } from "@/components/pannable-image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { MealPhoto } from "@/lib/types/meal";

interface MealDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealId: string;
}

export function MealDetailDialog({ open, onOpenChange, mealId }: MealDetailDialogProps) {
  const { data: meal, isLoading } = useMeal(mealId);
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
    if (!meal) return new Map<string, string[]>();
    const map = new Map<string, string[]>();
    for (const p of meal.photos) {
      if (p.meal_item_id) {
        const urls = map.get(p.meal_item_id) || [];
        if (!urls.includes(p.url)) map.set(p.meal_item_id, [...urls, p.url]);
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
                <button
                  type="button"
                  className="ml-auto text-muted-foreground hover:text-foreground transition-colors p-1"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="size-3.5" />
                </button>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {galleryPhotos.length > 0 && (
                <MealPhotoGallery
                  photos={galleryPhotos}
                  photoToItems={photoToItems}
                  onPhotoSelect={setSelectedPhotoUrl}
                />
              )}

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

              {meal.items.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-sm font-medium">Alimentos</h4>
                  <div className="space-y-2">
                    {[...meal.items].sort((a, b) => (b.calories ?? 0) - (a.calories ?? 0)).map((item) => {
                      const method = getMethodMeta(item.measurement_method);
                      const hasPhotos = itemToPhotos.has(item.id);
                      const isHighlighted = highlightedItemIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          className={`text-sm transition-colors duration-200 rounded-md ${
                            isHighlighted ? "bg-primary/10 px-2 py-1.5 -mx-2" : ""
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
                              {hasPhotos && (
                                <ImageIcon className="size-3 text-muted-foreground" />
                              )}
                            </div>
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

              {meal.tags.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-sm font-medium">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {meal.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

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
      {editOpen && meal && (
        <MealEditSheet
          open={editOpen}
          onOpenChange={(o) => {
            setEditOpen(o);
            if (!o) onOpenChange(false);
          }}
          mealId={meal.id}
        />
      )}
    </Dialog>
  );
}

function MealPhotoGallery({
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
        className="w-full rounded-md object-cover max-h-56"
        onClick={() => handleSelect(0)}
      />
    );
  }

  return (
    <div className="space-y-2">
      <PannableImage
        src={sorted[selected].url}
        className="w-full rounded-md object-cover max-h-56"
      />
      <div className="flex gap-1.5 overflow-x-auto">
        {sorted.map((photo, i) => {
          const hasItems = photoToItems.has(photo.url);
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => handleSelect(i)}
              className={`relative size-12 shrink-0 rounded overflow-hidden border-2 transition-colors ${
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
