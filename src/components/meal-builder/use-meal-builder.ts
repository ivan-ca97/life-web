"use client";

import { useState, useMemo, useCallback } from "react";
import { useDate } from "@/lib/date/context";
import { useCreateMeal, useMealPreview } from "@/lib/hooks/use-meals";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Food } from "@/lib/types/food";
import { getAvailableUnits, isMetricUnit } from "@/lib/food-units";
import type { CreateMealRequest, MealPhotoRequest } from "@/lib/types/meal";
import type { UploadedPhoto } from "@/lib/hooks/use-media";

export interface BuilderItem {
  food_id: string;
  food_name: string;
  quantity: string;
  unit: string;
  food_base_unit: string;
  food_base_quantity: number;
  food_conversion_units: string[];
  measurement_method: string;
  photos: UploadedPhoto[];
  notes: string;
}

export interface MealMeta {
  type: string;
  name?: string;
  eaten_time?: string;
  notes?: string;
  tags?: string[];
  photos?: UploadedPhoto[];
}

export function useMealBuilder() {
  const { date: globalDate } = useDate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<BuilderItem[]>([]);
  const createMutation = useCreateMeal();

  const addFood = useCallback((food: Food) => {
    setItems((prev) => {
      if (prev.some((i) => i.food_id === food.id)) return prev;
      const defaultQty = isMetricUnit(food.base_unit)
        ? Math.max(food.base_quantity, 100)
        : food.base_quantity;
      return [
        ...prev,
        {
          food_id: food.id,
          food_name: food.name,
          quantity: String(defaultQty),
          unit: food.base_unit,
          food_base_unit: food.base_unit,
          food_base_quantity: food.base_quantity,
          food_conversion_units: getAvailableUnits(food).filter((u) => u !== food.base_unit),
          measurement_method: "",
          photos: [],
          notes: "",
        },
      ];
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback(
    (index: number, field: keyof BuilderItem, value: string) => {
      setItems((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    []
  );

  const clearItems = useCallback(() => setItems([]), []);

  const foodIdsInBuilder = useMemo(
    () => new Set(items.map((i) => i.food_id)),
    [items]
  );

  const allValid = useMemo(
    () => items.length > 0 && items.every((i) => Number(i.quantity) > 0),
    [items]
  );

  const previewItems = useMemo(
    () =>
      items
        .filter((i) => Number(i.quantity) > 0)
        .map((i) => ({
          food_id: i.food_id,
          quantity: Number(i.quantity),
          unit: i.unit,
        })),
    [items]
  );

  const {
    data: preview,
    isFetching: previewLoading,
  } = useMealPreview(previewItems);

  const saveMeal = useCallback(
    (meta: MealMeta) => {
      const photoReqs: MealPhotoRequest[] | undefined = meta.photos?.length
        ? meta.photos.map((p) => ({ url: p.url, is_primary: p.is_primary }))
        : undefined;
      const req: CreateMealRequest = {
        date: globalDate,
        type: meta.type,
        name: meta.name || undefined,
        photos: photoReqs,
        eaten_at: meta.eaten_time
          ? `${globalDate}T${meta.eaten_time}:00Z`
          : undefined,
        tags: meta.tags ?? [],
        items: items.map((i) => ({
          food_id: i.food_id,
          quantity: Number(i.quantity) || 0,
          unit: i.unit,
          measurement_method: i.measurement_method || undefined,
          notes: i.notes || undefined,
        })),
        notes: meta.notes ?? "",
      };
      createMutation.mutate(req, {
        onSuccess: () => {
          toast.success("Comida registrada");
          setItems([]);
          setOpen(false);
        },
        onError: (err) => toast.error(err.message),
      });
    },
    [globalDate, items, createMutation]
  );

  const reset = useCallback(() => {
    setItems([]);
    setOpen(false);
  }, []);

  return {
    open,
    setOpen,
    items,
    addFood,
    removeItem,
    updateItem,
    clearItems,
    foodIdsInBuilder,
    allValid,
    preview,
    previewLoading,
    saveMeal,
    isSaving: createMutation.isPending,
    reset,
  };
}
