"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDate } from "@/lib/date/context";
import {
  DndContext,
  DragOverlay,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, ChevronDown, ChevronRight, Loader2, ImagePlus, Star, Clock } from "lucide-react";
import { addDays, format, parse, differenceInCalendarDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FoodSearchCombobox } from "@/components/food-search-combobox";
import { TagInput } from "@/components/tag-input";
import { MacroBar } from "@/components/macro-bar";
import { useQueries } from "@tanstack/react-query";
import { useMealPreview } from "@/lib/hooks/use-meals";
import * as foodsApi from "@/lib/api/foods";
import { useMealTags } from "@/lib/hooks/use-tags";
import type { Meal, MealItemRequest, MealPhotoRequest } from "@/lib/types/meal";
import type { Food } from "@/lib/types/food";
import { useMediaUpload, type UploadedPhoto } from "@/lib/hooks/use-media";
import { getAvailableUnits, isMetricUnit, buildUnitMap } from "@/lib/food-units";
import { MEASUREMENT_METHODS, getMethodLabel } from "@/lib/measurement-method";
import { fmtCal, fmtGrams } from "@/lib/format";
import { toast } from "sonner";

interface MealFormValues {
  date: string;
  eaten_time: string;
  type: string;
  name: string;
  notes: string;
}

type MacroField = "calories" | "protein_grams" | "carbs_grams" | "fat_grams" | "fiber_grams";

const macroFieldsMeta: { key: MacroField; label: string }[] = [
  { key: "calories", label: "Calorias" },
  { key: "protein_grams", label: "Proteinas (g)" },
  { key: "carbs_grams", label: "Carbohidratos (g)" },
  { key: "fat_grams", label: "Grasas (g)" },
  { key: "fiber_grams", label: "Fibra (g)" },
];

interface MealItemRow {
  item_id?: string;
  food_id: string;
  food_name: string;
  quantity: string;
  unit: string;
  food_base_unit: string;
  food_base_quantity: number;
  food_conversion_units: string[];
  food_unit_map: Record<string, number>;
  measurement_method: string;
  associatedPhotoUrls: string[];
  primaryPhotoUrl: string | null;
  notes: string;
}

interface MealFormProps {
  defaultValues?: Meal;
  onSubmit: (data: {
    date: string;
    eaten_at?: string;
    type: string;
    name?: string;
    photos?: MealPhotoRequest[];
    calories?: number;
    protein_grams?: number;
    carbs_grams?: number;
    fat_grams?: number;
    fiber_grams?: number;
    tags: string[];
    items: MealItemRequest[];
    notes: string;
  }) => void;
  isLoading: boolean;
}

function parseTimeFromFilename(filename: string): { time: string; date: string } | null {
  const match = filename.match(/(\d{4})(\d{2})(\d{2})[_-](\d{2})(\d{2})(\d{2})/);
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  const hour = Number(h);
  const minute = Number(mi);
  if (hour > 23 || minute > 59 || Number(mo) > 12 || Number(d) > 31) return null;

  // Google Pixel (PXL_) stores UTC timestamps in filenames — convert to local
  if (/^PXL_/i.test(filename)) {
    const utc = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), hour, minute, Number(s)));
    return { time: format(utc, "HH:mm"), date: format(utc, "yyyy-MM-dd") };
  }

  return { time: `${h}:${mi}`, date: `${y}-${mo}-${d}` };
}

async function parseTimeFromExif(file: File): Promise<{ time: string; date: string } | null> {
  try {
    const { default: exifr } = await import("exifr");
    const tags = await exifr.parse(file, { pick: ["DateTimeOriginal", "CreateDate"] });
    const dt: Date | undefined = tags?.DateTimeOriginal ?? tags?.CreateDate;
    if (!(dt instanceof Date) || isNaN(dt.getTime())) return null;
    return { time: format(dt, "HH:mm"), date: format(dt, "yyyy-MM-dd") };
  } catch {
    return null;
  }
}

async function getEarliestTimeFromFiles(files: File[]): Promise<{ time: string; date: string; filename: string } | null> {
  let earliest: { time: string; date: string; filename: string } | null = null;

  // First pass: try filename parsing (sync, fast)
  for (const f of files) {
    const parsed = parseTimeFromFilename(f.name);
    if (!parsed) continue;
    const key = `${parsed.date}T${parsed.time}`;
    if (!earliest || key < `${earliest.date}T${earliest.time}`) {
      earliest = { ...parsed, filename: f.name };
    }
  }
  if (earliest) return earliest;

  // Fallback: read EXIF metadata
  for (const f of files) {
    const parsed = await parseTimeFromExif(f);
    if (!parsed) continue;
    const key = `${parsed.date}T${parsed.time}`;
    if (!earliest || key < `${earliest.date}T${earliest.time}`) {
      earliest = { ...parsed, filename: f.name };
    }
  }
  return earliest;
}

function toOptNum(val: string): number | undefined {
  if (val === "") return undefined;
  const n = Number(val);
  if (isNaN(n)) return undefined;
  return n;
}

/* ---------- Drag & Drop sub-components ---------- */

function SortablePhoto({
  url,
  isPrimary,
  onSetPrimary,
  onRemove,
  idPrefix = "photo",
}: {
  url: string;
  isPrimary: boolean;
  onSetPrimary: () => void;
  onRemove: () => void;
  idPrefix?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${idPrefix}-${url}`,
    data: { url },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative size-20 rounded-md overflow-hidden border cursor-grab active:cursor-grabbing touch-none ${
        isDragging ? "opacity-30" : ""
      }`}
    >
      <img src={url} alt="" className="size-full object-cover pointer-events-none" />
      <button
        type="button"
        className={`absolute top-0.5 left-0.5 p-0.5 rounded-sm transition-colors ${
          isPrimary ? "text-yellow-400" : "text-white/50 hover:text-yellow-400"
        }`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onSetPrimary}
        title="Foto principal"
      >
        <Star className={`size-3.5 ${isPrimary ? "fill-yellow-400" : ""}`} />
      </button>
      <button
        type="button"
        className="absolute top-0.5 right-0.5 p-0.5 rounded-sm text-white/50 hover:text-red-400 transition-colors"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onRemove}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

function DroppableItemCard({
  id,
  isDragging,
  children,
}: {
  id: string;
  isDragging: boolean;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <Card
      ref={setNodeRef}
      className={
        isDragging
          ? isOver
            ? "ring-2 ring-primary bg-primary/5"
            : "ring-1 ring-dashed ring-muted-foreground/30"
          : ""
      }
    >
      {children}
    </Card>
  );
}

/* ---------- Main form ---------- */

export function MealForm({ defaultValues, onSubmit, isLoading }: MealFormProps) {
  const isEditing = !!defaultValues;
  const { date: globalDate } = useDate();
  const [tags, setTags] = useState<string[]>(defaultValues?.tags ?? []);
  const [photos, setPhotos] = useState<UploadedPhoto[]>(
    defaultValues?.photos
      ?.filter((p) => !p.meal_item_id)
      .map((p) => ({ url: p.url, is_primary: p.is_primary })) ?? []
  );
  const [extraOpen, setExtraOpen] = useState(false);
  const { data: tagSuggestions } = useMealTags();
  const [submitError, setSubmitError] = useState("");
  const [dayOffset, setDayOffset] = useState<number>(() => {
    if (!defaultValues?.eaten_at || !defaultValues?.date) return 0;
    const diff = differenceInCalendarDays(
      parse(defaultValues.eaten_at.slice(0, 10), "yyyy-MM-dd", new Date()),
      parse(defaultValues.date, "yyyy-MM-dd", new Date())
    );
    return Math.max(0, Math.min(1, diff));
  });
  const [items, setItems] = useState<MealItemRow[]>(
    defaultValues?.items.map((i) => ({
      item_id: i.id,
      food_id: i.food_id,
      food_name: i.food_name,
      quantity: String(i.input_quantity),
      unit: i.input_unit,
      food_base_unit: i.normalized_unit,
      food_base_quantity: 0,
      food_conversion_units: [],
      food_unit_map: {},
      measurement_method: i.measurement_method ?? "",
      associatedPhotoUrls: defaultValues.photos
        .filter((p) => p.meal_item_id === i.id)
        .map((p) => p.url),
      primaryPhotoUrl:
        defaultValues.photos.find((p) => p.meal_item_id === i.id && p.is_primary)
          ?.url ?? null,
      notes: i.notes,
    })) ?? []
  );

  /* Fetch full food data for edit mode so unit selects have all options */
  const editFoodIds = useMemo(
    () => (defaultValues ? [...new Set(defaultValues.items.map((i) => i.food_id))] : []),
    [defaultValues]
  );
  const foodQueries = useQueries({
    queries: editFoodIds.map((id) => ({
      queryKey: ["foods", id],
      queryFn: () => foodsApi.getFood(id),
      enabled: editFoodIds.length > 0,
      staleTime: Infinity,
    })),
  });
  const [foodsPatched, setFoodsPatched] = useState(false);
  useEffect(() => {
    if (foodsPatched) return;
    if (!editFoodIds.length) return;
    if (foodQueries.some((q) => q.isLoading)) return;
    const foodMap = new Map(
      foodQueries.filter((q) => q.data).map((q) => [q.data!.id, q.data!])
    );
    if (foodMap.size === 0) return;
    setItems((prev) =>
      prev.map((item) => {
        const food = foodMap.get(item.food_id);
        if (!food) return item;
        const allUnits = getAvailableUnits(food);
        return {
          ...item,
          food_base_unit: food.base_unit,
          food_base_quantity: food.base_quantity,
          food_conversion_units: allUnits.filter((u) => u !== food.base_unit),
          food_unit_map: buildUnitMap(food),
        };
      })
    );
    setFoodsPatched(true);
  }, [foodQueries, editFoodIds, foodsPatched]);

  /* Photo upload */
  const { uploadFiles, uploading, progress } = useMediaUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileDragOver, setFileDragOver] = useState(false);

  /* DnD sensors — require 8px movement so clicks on star/X buttons work */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );
  const [activeDragUrl, setActiveDragUrl] = useState<string | null>(null);

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveDragUrl((e.active.data.current as { url: string })?.url ?? null);
  }, []);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    setActiveDragUrl(null);
    if (!e.over || e.active.id === e.over.id) return;
    const url = (e.active.data.current as { url: string })?.url;
    if (!url) return;
    const activeId = e.active.id.toString();
    const overId = e.over.id.toString();

    // Reorder item photos
    const itemMatch = activeId.match(/^item-(\d+)-photo-/);
    if (itemMatch && overId.startsWith(`item-${itemMatch[1]}-photo-`)) {
      const itemIndex = Number(itemMatch[1]);
      const overUrl = (e.over.data.current as { url: string })?.url;
      if (!overUrl) return;
      setItems((prev) => {
        const item = prev[itemIndex];
        const oldIdx = item.associatedPhotoUrls.indexOf(url);
        const newIdx = item.associatedPhotoUrls.indexOf(overUrl);
        if (oldIdx === -1 || newIdx === -1) return prev;
        const updated = [...prev];
        updated[itemIndex] = {
          ...item,
          associatedPhotoUrls: arrayMove(item.associatedPhotoUrls, oldIdx, newIdx),
        };
        return updated;
      });
      return;
    }

    // Reorder meal-level photos
    if (overId.startsWith("photo-")) {
      const overUrl = (e.over.data.current as { url: string })?.url;
      if (!overUrl) return;
      setPhotos((prev) => {
        const oldIndex = prev.findIndex((p) => p.url === url);
        const newIndex = prev.findIndex((p) => p.url === overUrl);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
      return;
    }

    // Drop photo onto item card
    if (overId.startsWith("item-drop-")) {
      const itemIndex = Number(overId.replace("item-drop-", ""));
      if (isNaN(itemIndex)) return;
      setItems((prev) => {
        const item = prev[itemIndex];
        if (item.associatedPhotoUrls.includes(url)) return prev;
        const updated = [...prev];
        updated[itemIndex] = {
          ...item,
          associatedPhotoUrls: [...item.associatedPhotoUrls, url],
          primaryPhotoUrl: item.primaryPhotoUrl ?? url,
        };
        return updated;
      });
    }
  }, []);

  /* Preview */
  const previewItems = useMemo(
    () => items.map((i) => ({ food_id: i.food_id, quantity: Number(i.quantity), unit: i.unit })),
    [items]
  );
  const { data: preview, isFetching: previewLoading, error: previewError } = useMealPreview(previewItems);
  const [macroOverrides, setMacroOverrides] = useState<Partial<Record<MacroField, string>>>({});

  function getMacroValue(field: MacroField): string {
    if (field in macroOverrides) return macroOverrides[field]!;
    if (!preview) return "";
    const val = preview[field];
    if (val == null) return "";
    return field === "calories" ? fmtCal(val) : fmtGrams(val);
  }

  function isOverridden(field: MacroField): boolean {
    return field in macroOverrides;
  }

  function handleMacroChange(field: MacroField, value: string) {
    setMacroOverrides((prev) => ({ ...prev, [field]: value }));
  }

  function resetMacro(field: MacroField) {
    setMacroOverrides((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function getEffectiveNumber(field: MacroField): number {
    if (field in macroOverrides) return Number(macroOverrides[field]) || 0;
    return preview?.[field] ?? 0;
  }

  const [timeSuggestion, setTimeSuggestion] = useState<{ time: string; date: string; filename: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MealFormValues>({
    defaultValues: {
      date: defaultValues?.date ?? globalDate,
      eaten_time:
        defaultValues?.eaten_at?.slice(11, 16) ??
        (globalDate === format(new Date(), "yyyy-MM-dd")
          ? format(new Date(), "HH:mm")
          : "00:00"),
      type: defaultValues?.type ?? "",
      name: defaultValues?.name ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  /* --- Photo handlers --- */

  async function handleFileUpload(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) =>
      ["image/jpeg", "image/png", "image/webp"].includes(f.type)
    );
    if (arr.length === 0) return;

    getEarliestTimeFromFiles(arr).then((detected) => {
      if (!detected) return;
      const currentTime = watch("eaten_time");
      const referenceTime = timeSuggestion?.time ?? currentTime;
      if (referenceTime && referenceTime !== "00:00" && detected.time >= referenceTime) return;
      setTimeSuggestion(detected);
    });

    try {
      const urls = await uploadFiles(arr);
      const newPhotos: UploadedPhoto[] = urls.map((url) => ({
        url,
        is_primary: false,
      }));
      const combined = [...photos, ...newPhotos];
      if (!combined.some((p) => p.is_primary) && combined.length > 0) {
        combined[0] = { ...combined[0], is_primary: true };
      }
      setPhotos(combined);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir fotos");
    }
  }

  function handleRemovePhoto(index: number) {
    const removed = photos[index];
    const updated = photos.filter((_, i) => i !== index);
    if (removed.is_primary && updated.length > 0) {
      updated[0] = { ...updated[0], is_primary: true };
    }
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        associatedPhotoUrls: item.associatedPhotoUrls.filter((u) => u !== removed.url),
      }))
    );
    setPhotos(updated);
  }

  function handleSetPrimary(index: number) {
    setPhotos(photos.map((p, i) => ({ ...p, is_primary: i === index })));
  }

  function handleDisassociatePhoto(itemIndex: number, url: string) {
    setItems((prev) => {
      const updated = [...prev];
      const item = updated[itemIndex];
      const newUrls = item.associatedPhotoUrls.filter((u) => u !== url);
      updated[itemIndex] = {
        ...item,
        associatedPhotoUrls: newUrls,
        primaryPhotoUrl:
          item.primaryPhotoUrl === url ? newUrls[0] ?? null : item.primaryPhotoUrl,
      };
      return updated;
    });
  }

  function handleSetItemPrimary(itemIndex: number, url: string) {
    setItems((prev) => {
      const updated = [...prev];
      updated[itemIndex] = { ...updated[itemIndex], primaryPhotoUrl: url };
      return updated;
    });
  }

  /* --- Item handlers --- */

  function handleAddFood(food: Food) {
    const defaultQty = isMetricUnit(food.base_unit)
      ? Math.max(food.base_quantity, 100)
      : food.base_quantity;
    setItems([
      ...items,
      {
        food_id: food.id,
        food_name: food.name,
        quantity: String(defaultQty),
        unit: food.base_unit,
        food_base_unit: food.base_unit,
        food_base_quantity: food.base_quantity,
        food_conversion_units: getAvailableUnits(food).filter((u) => u !== food.base_unit),
        food_unit_map: buildUnitMap(food),
        measurement_method: "",
        associatedPhotoUrls: [],
        primaryPhotoUrl: null,
        notes: "",
      },
    ]);
  }

  function handleRemoveItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function handleItemChange(index: number, field: keyof MealItemRow, value: string | number) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  /* --- Submit --- */

  function onFormSubmit(values: MealFormValues) {
    const hasMacros = macroFieldsMeta.some(({ key }) => getEffectiveNumber(key) > 0);
    const hasDescription = values.notes.trim() !== "" || values.name.trim() !== "";
    if (!hasMacros && !hasDescription) {
      setSubmitError("Agrega al menos un macro estimado o una descripcion/nota.");
      return;
    }
    setSubmitError("");

    const allPhotos: MealPhotoRequest[] = [];
    for (const p of photos) {
      allPhotos.push({ url: p.url, is_primary: p.is_primary });
    }
    for (const item of items) {
      for (const url of item.associatedPhotoUrls) {
        allPhotos.push({ url, is_primary: url === item.primaryPhotoUrl, item_food_id: item.food_id });
      }
    }

    onSubmit({
      date: values.date,
      eaten_at: values.eaten_time
        ? `${format(addDays(parse(values.date, "yyyy-MM-dd", new Date()), dayOffset), "yyyy-MM-dd")}T${values.eaten_time}:00Z`
        : undefined,
      type: values.type,
      name: values.name || undefined,
      photos: allPhotos.length > 0 ? allPhotos : undefined,
      calories: macroOverrides.calories !== undefined ? toOptNum(macroOverrides.calories) : undefined,
      protein_grams: macroOverrides.protein_grams !== undefined ? toOptNum(macroOverrides.protein_grams) : undefined,
      carbs_grams: macroOverrides.carbs_grams !== undefined ? toOptNum(macroOverrides.carbs_grams) : undefined,
      fat_grams: macroOverrides.fat_grams !== undefined ? toOptNum(macroOverrides.fat_grams) : undefined,
      fiber_grams: macroOverrides.fiber_grams !== undefined ? toOptNum(macroOverrides.fiber_grams) : undefined,
      tags,
      items: items.map((i) => ({
        food_id: i.food_id,
        quantity: Number(i.quantity),
        unit: i.unit,
        measurement_method: i.measurement_method || undefined,
        notes: i.notes,
      })),
      notes: values.notes,
    });
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 max-w-2xl">
        {/* Fecha + Hora (edicion) o Tipo + Hora (creacion) */}
        {isEditing && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" type="date" {...register("date", { required: "La fecha es obligatoria" })} />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <div className="flex items-center gap-1">
                <Input type="time" className="flex-1" {...register("eaten_time")} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className={dayOffset === 1 ? "text-primary" : ""}
                  onClick={() => setDayOffset(dayOffset === 1 ? 0 : 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
              {dayOffset === 1 && <p className="text-xs text-muted-foreground">Dia siguiente</p>}
            </div>
          </div>
        )}
        {!isEditing && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={watch("date")} disabled className="opacity-60" />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <div className="flex items-center gap-1">
                <Input type="time" className="flex-1" {...register("eaten_time")} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className={dayOffset === 1 ? "text-primary" : ""}
                  onClick={() => setDayOffset(dayOffset === 1 ? 0 : 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
              {dayOffset === 1 && <p className="text-xs text-muted-foreground">Dia siguiente</p>}
            </div>
          </div>
        )}
        <div className={isEditing ? "grid grid-cols-1 gap-4" : ""}>
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Input
              id="type"
              placeholder="desayuno, almuerzo..."
              {...register("type", { required: "El tipo es obligatorio" })}
            />
            {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
          </div>
        </div>

        {/* Macros */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Macros</Label>
            {previewLoading && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
            {previewError && (
              <span className="text-xs text-destructive">
                {previewError instanceof Error ? previewError.message : "Error al cargar preview"}
              </span>
            )}
          </div>
          <div className="grid grid-cols-5 gap-2 items-end">
            {macroFieldsMeta.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    value={getMacroValue(key)}
                    onChange={(e) => handleMacroChange(key, e.target.value)}
                    className={isOverridden(key) ? "border-amber-500/70 pr-7" : ""}
                  />
                  {isOverridden(key) && (
                    <button
                      type="button"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => resetMacro(key)}
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <MacroBar
            protein={getEffectiveNumber("protein_grams")}
            carbs={getEffectiveNumber("carbs_grams")}
            fat={getEffectiveNumber("fat_grams")}
          />
        </div>

        {/* Fotos */}
        <div className="space-y-2">
          <Label>Fotos</Label>
          {photos.length > 0 && (
            <SortableContext
              items={photos.map((p) => `photo-${p.url}`)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex flex-wrap gap-2">
                {photos.map((photo, index) => (
                  <SortablePhoto
                    key={photo.url}
                    url={photo.url}
                    isPrimary={photo.is_primary}
                    onSetPrimary={() => handleSetPrimary(index)}
                    onRemove={() => handleRemovePhoto(index)}
                  />
                ))}
              </div>
            </SortableContext>
          )}
          {items.length > 0 && photos.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Arrastra una foto a un alimento para asociarla, o entre fotos para reordenar
            </p>
          )}
          {timeSuggestion && (() => {
            const mealDate = watch("date");
            const photoDate = timeSuggestion.date;
            const diffDays = differenceInCalendarDays(
              parse(photoDate, "yyyy-MM-dd", new Date()),
              parse(mealDate, "yyyy-MM-dd", new Date())
            );
            const isNextDay = diffDays === 1;
            const isSameDay = diffDays === 0;
            const isOdd = !isSameDay && !isNextDay;

            return (
              <div className={`flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                isOdd ? "bg-amber-500/10 border-amber-500/30" : "bg-muted/50"
              }`}>
                <Clock className="size-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">
                  Hora detectada: <strong className="text-foreground">{timeSuggestion.time}</strong>
                  {isNextDay && <span className="ml-1 text-primary">(dia siguiente)</span>}
                  {isOdd && (
                    <span className="ml-1 text-amber-500">
                      (foto del {photoDate}, {diffDays > 0 ? `${diffDays} dias despues` : `${Math.abs(diffDays)} dias antes`})
                    </span>
                  )}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-auto h-7 text-xs"
                  onClick={() => {
                    setValue("eaten_time", timeSuggestion.time);
                    if (isNextDay) {
                      setDayOffset(1);
                    } else if (isSameDay) {
                      setDayOffset(0);
                    } else if (isEditing) {
                      setValue("date", photoDate);
                      setDayOffset(0);
                    }
                    setTimeSuggestion(null);
                  }}
                >
                  Aplicar
                </Button>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setTimeSuggestion(null)}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            );
          })()}
          <div
            onDrop={(e) => {
              e.preventDefault();
              setFileDragOver(false);
              handleFileUpload(e.dataTransfer.files);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setFileDragOver(true);
            }}
            onDragLeave={() => setFileDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 cursor-pointer transition-colors text-sm text-muted-foreground ${
              fileDragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>
                  Subiendo {progress.done}/{progress.total}...
                </span>
              </>
            ) : (
              <>
                <ImagePlus className="size-4" />
                <span>Arrastra fotos o haz click para seleccionar</span>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFileUpload(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {/* Alimentos */}
        <div className="space-y-3">
          <Label>Alimentos</Label>
          {items.map((item, index) => (
            <DroppableItemCard key={index} id={`item-drop-${index}`} isDragging={!!activeDragUrl}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{item.food_name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => handleRemoveItem(index)}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label className="text-xs">Cantidad</Label>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, "quantity", e.target.value.replace(/^0+(?=\d)/, ""))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Unidad</Label>
                    <Select
                      value={item.unit}
                      onValueChange={(v) => {
                        const newUnit = v ?? item.unit;
                        const updated = [...items];
                        updated[index] = {
                          ...updated[index],
                          unit: newUnit,
                          quantity: isMetricUnit(newUnit)
                            ? String(Math.max(item.food_base_quantity, 100))
                            : "1",
                        };
                        setItems(updated);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const portionUnits = item.food_conversion_units.filter((u) => !isMetricUnit(u));
                          const metricUnits = [item.food_base_unit, ...item.food_conversion_units.filter((u) => isMetricUnit(u))];
                          return (
                            <>
                              {portionUnits.map((u) => (
                                <SelectItem key={u} value={u}>{u}</SelectItem>
                              ))}
                              {portionUnits.length > 0 && <SelectSeparator />}
                              {metricUnits.map((u) => (
                                <SelectItem key={u} value={u}>{u}</SelectItem>
                              ))}
                            </>
                          );
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Metodo</Label>
                    <Select
                      value={item.measurement_method}
                      onValueChange={(v) => handleItemChange(index, "measurement_method", v ?? "")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="—">
                          {getMethodLabel(item.measurement_method) || "—"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="" label="—">—</SelectItem>
                        {MEASUREMENT_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value} label={m.label}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Notas</Label>
                    <Input
                      value={item.notes}
                      onChange={(e) => handleItemChange(index, "notes", e.target.value)}
                    />
                  </div>
                </div>
                {(() => {
                  const pi = preview?.items?.[index];
                  const parts: string[] = [];
                  const factor = item.food_unit_map[item.unit];
                  if (factor != null && !isMetricUnit(item.unit)) {
                    const equiv = Number(item.quantity) * factor;
                    if (equiv > 0) parts.push(`${fmtGrams(equiv)} ${item.food_base_unit}`);
                  }
                  if (pi?.calories != null) parts.push(`${fmtCal(pi.calories)} kcal`);
                  if (pi?.protein_grams != null) parts.push(`${fmtGrams(pi.protein_grams)}g prot`);
                  if (pi?.carbs_grams != null) parts.push(`${fmtGrams(pi.carbs_grams)}g carbs`);
                  if (pi?.fat_grams != null) parts.push(`${fmtGrams(pi.fat_grams)}g grasa`);
                  if (pi?.fiber_grams != null) parts.push(`${fmtGrams(pi.fiber_grams)}g fibra`);
                  if (parts.length === 0) return null;
                  return <p className="text-xs text-muted-foreground">{parts.join(" · ")}</p>;
                })()}
                {item.associatedPhotoUrls.length > 0 && (
                  <SortableContext
                    items={item.associatedPhotoUrls.map((u) => `item-${index}-photo-${u}`)}
                    strategy={horizontalListSortingStrategy}
                  >
                    <div className="flex flex-wrap gap-2">
                      {item.associatedPhotoUrls.map((url) => (
                        <SortablePhoto
                          key={url}
                          url={url}
                          idPrefix={`item-${index}-photo`}
                          isPrimary={url === item.primaryPhotoUrl}
                          onSetPrimary={() => handleSetItemPrimary(index, url)}
                          onRemove={() => handleDisassociatePhoto(index, url)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                )}
              </CardContent>
            </DroppableItemCard>
          ))}
          <FoodSearchCombobox
            onSelect={handleAddFood}
            excludeIds={items.map((i) => i.food_id)}
          />
        </div>

        {/* Opciones adicionales */}
        <div>
          <button
            type="button"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setExtraOpen(!extraOpen)}
          >
            <ChevronDown
              className={`size-4 transition-transform ${extraOpen ? "rotate-180" : ""}`}
            />
            Opciones adicionales
          </button>
          {extraOpen && (
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" {...register("name")} />
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <TagInput value={tags} onChange={setTags} suggestions={tagSuggestions} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea id="notes" rows={2} {...register("notes")} />
              </div>
            </div>
          )}
        </div>

        {submitError && <p className="text-sm text-destructive">{submitError}</p>}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Guardando..." : "Guardar"}
        </Button>
      </form>

      <DragOverlay>
        {activeDragUrl && (
          <div className="size-16 rounded-md overflow-hidden border-2 border-primary shadow-lg opacity-80">
            <img src={activeDragUrl} alt="" className="size-full object-cover" />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
