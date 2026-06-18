"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDate } from "@/lib/date/context";
import { ChevronDown, ChevronRight } from "lucide-react";
import { addDays, format, parse, differenceInCalendarDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/tag-input";
import { useExerciseTags } from "@/lib/hooks/use-tags";
import { useCalorieEstimate } from "@/lib/hooks/use-exercises";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Exercise } from "@/lib/types/exercise";

const exerciseTypes = [
  { value: "weightlifting", label: "Pesas" },
  { value: "walking", label: "Caminata" },
  { value: "cycling", label: "Ciclismo" },
  { value: "running", label: "Carrera" },
  { value: "other", label: "Otro" },
] as const;

interface ExerciseFormValues {
  date: string;
  type: string;
  name: string;
  started_time: string;
  duration_h: string;
  duration_m: string;
  duration_s: string;
  estimated_calories_burned: string;
  steps: string;
  distance_meters: string;
  max_speed_kmh: string;
  elevation_gain_meters: string;
  average_heart_rate: string;
  max_heart_rate: string;
  total_volume_kg: string;
  total_sets: string;
  notes: string;
}

interface ExerciseFormProps {
  defaultValues?: Exercise;
  onSubmit: (data: {
    date: string;
    type: string;
    name: string;
    started_at?: string;
    duration_seconds?: number;
    estimated_calories_burned?: number;
    steps?: number;
    distance_meters?: number;
    max_speed_kmh?: number;
    elevation_gain_meters?: number;
    average_heart_rate?: number;
    max_heart_rate?: number;
    total_volume_kg?: number;
    total_sets?: number;
    tags: string[];
    notes: string;
  }) => void;
  isLoading: boolean;
}

function toOptNum(val: string): number | undefined {
  if (val === "") return undefined;
  const n = Number(val);
  if (isNaN(n)) return undefined;
  return n;
}

export function ExerciseForm({ defaultValues, onSubmit, isLoading }: ExerciseFormProps) {
  const { date: globalDate } = useDate();
  const [tags, setTags] = useState<string[]>(defaultValues?.tags ?? []);
  const [extraOpen, setExtraOpen] = useState(false);
  const { data: tagSuggestions } = useExerciseTags();
  const [dayOffset, setDayOffset] = useState<number>(() => {
    if (!defaultValues?.started_at || !defaultValues?.date) return 0;
    const diff = differenceInCalendarDays(
      parse(defaultValues.started_at.slice(0, 10), "yyyy-MM-dd", new Date()),
      parse(defaultValues.date, "yyyy-MM-dd", new Date())
    );
    return Math.max(0, Math.min(1, diff));
  });

  const initDuration = defaultValues?.duration_seconds ?? null;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExerciseFormValues>({
    defaultValues: {
      date: defaultValues?.date ?? globalDate,
      type: defaultValues?.type ?? "",
      name: defaultValues?.name ?? "",
      started_time: defaultValues?.started_at?.slice(11, 16) ?? (globalDate === format(new Date(), "yyyy-MM-dd") ? format(new Date(), "HH:mm") : "00:00"),
      duration_h: initDuration != null ? Math.floor(initDuration / 3600).toString() : "",
      duration_m: initDuration != null ? Math.floor((initDuration % 3600) / 60).toString() : "",
      duration_s: initDuration != null ? (initDuration % 60).toString() : "",
      estimated_calories_burned: defaultValues?.estimated_calories_burned?.toString() ?? "",
      steps: defaultValues?.steps?.toString() ?? "",
      distance_meters: defaultValues?.distance_meters?.toString() ?? "",
      max_speed_kmh: defaultValues?.max_speed_kmh?.toString() ?? "",
      elevation_gain_meters: defaultValues?.elevation_gain_meters?.toString() ?? "",
      average_heart_rate: defaultValues?.average_heart_rate?.toString() ?? "",
      max_heart_rate: defaultValues?.max_heart_rate?.toString() ?? "",
      total_volume_kg: defaultValues?.total_volume_kg?.toString() ?? "",
      total_sets: defaultValues?.total_sets?.toString() ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  const exerciseType = watch("type");
  const durationH = watch("duration_h");
  const durationM = watch("duration_m");
  const stepsRaw = watch("steps");
  const showCardio = ["walking", "running", "cycling"].includes(exerciseType);
  const showSteps = ["walking", "running"].includes(exerciseType);
  const showStrength = exerciseType === "weightlifting";

  const stepsNum = Number(stepsRaw) || 0;
  const calorieEstimate = useCalorieEstimate(showSteps ? stepsNum : 0);

  function onFormSubmit(values: ExerciseFormValues) {
    onSubmit({
      date: values.date,
      type: values.type,
      name: values.name,
      started_at: values.started_time
        ? `${format(addDays(parse(values.date, "yyyy-MM-dd", new Date()), dayOffset), "yyyy-MM-dd")}T${values.started_time}:00Z`
        : undefined,
      duration_seconds: (() => {
        const h = Number(values.duration_h) || 0;
        const m = Number(values.duration_m) || 0;
        const s = Number(values.duration_s) || 0;
        const total = h * 3600 + m * 60 + s;
        return total > 0 ? total : undefined;
      })(),
      estimated_calories_burned: toOptNum(values.estimated_calories_burned),
      steps: toOptNum(values.steps),
      distance_meters: toOptNum(values.distance_meters),
      max_speed_kmh: toOptNum(values.max_speed_kmh),
      elevation_gain_meters: toOptNum(values.elevation_gain_meters),
      average_heart_rate: toOptNum(values.average_heart_rate),
      max_heart_rate: toOptNum(values.max_heart_rate),
      total_volume_kg: toOptNum(values.total_volume_kg),
      total_sets: toOptNum(values.total_sets),
      tags,
      notes: values.notes,
    });
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 max-w-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select
            value={exerciseType}
            onValueChange={(v) => setValue("type", v ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo">
                {exerciseTypes.find((t) => t.value === exerciseType)?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {exerciseTypes.map((t) => (
                <SelectItem key={t.value} value={t.value} label={t.label}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-sm text-destructive">{errors.type.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Hora inicio</Label>
          <div className="flex items-center gap-1">
            <Input type="time" className="flex-1" {...register("started_time")} />
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
          {dayOffset === 1 && (
            <p className="text-xs text-muted-foreground">Dia siguiente</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Duracion</Label>
        <div className="grid grid-cols-3 gap-2">
          <div className="relative">
            <Input className="pr-7 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" type="number" min="0" placeholder="0" {...register("duration_h")} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">h</span>
          </div>
          <div className="relative">
            <Input className="pr-7 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" type="number" min="0" max={durationH ? 59 : undefined} placeholder="0" {...register("duration_m")} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">m</span>
          </div>
          <div className="relative">
            <Input className="pr-7 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" type="number" min="0" max={durationM ? 59 : undefined} placeholder="0" {...register("duration_s")} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">s</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Calorias quemadas</Label>
          <Input type="number" step="any" min="0" {...register("estimated_calories_burned")} />
        </div>
        <div className="space-y-2">
          <Label>FC media (bpm)</Label>
          <Input type="number" min="0" {...register("average_heart_rate")} />
        </div>
        <div className="space-y-2">
          <Label>FC max (bpm)</Label>
          <Input type="number" min="0" {...register("max_heart_rate")} />
        </div>
      </div>

      {showStrength && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Volumen total (kg)</Label>
            <Input type="number" step="any" min="0" {...register("total_volume_kg")} />
          </div>
          <div className="space-y-2">
            <Label>Series totales</Label>
            <Input type="number" min="0" {...register("total_sets")} />
          </div>
        </div>
      )}

      {showSteps && (
        <div className="space-y-2">
          <Label>Pasos</Label>
          <Input type="number" min="0" {...register("steps")} />
          {calorieEstimate.data && (
            <p className="text-xs text-muted-foreground">
              ~{Math.round(calorieEstimate.data.estimated_calories)} kcal estimadas
              <span className="ml-1 opacity-70">
                (basado en tu peso de {calorieEstimate.data.weight_kg.toFixed(1)} kg)
              </span>
            </p>
          )}
        </div>
      )}

      {showCardio && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Distancia (m)</Label>
            <Input type="number" step="any" min="0" {...register("distance_meters")} />
          </div>
          <div className="space-y-2">
            <Label>Vel. max (km/h)</Label>
            <Input type="number" step="any" min="0" {...register("max_speed_kmh")} />
          </div>
          <div className="space-y-2">
            <Label>Desnivel (m)</Label>
            <Input type="number" step="any" min="0" {...register("elevation_gain_meters")} />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Tags</Label>
        <TagInput value={tags} onChange={setTags} suggestions={tagSuggestions} />
      </div>

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
              <Input id="name" {...register("name", { required: "El nombre es obligatorio" })} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" rows={2} {...register("notes")} />
            </div>
          </div>
        )}
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Guardando..." : "Guardar"}
      </Button>
    </form>
  );
}
