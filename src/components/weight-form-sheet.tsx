"use client";

import { useForm } from "react-hook-form";
import { useDate } from "@/lib/date/context";
import { toast } from "sonner";
import {
  useWeightEntry,
  useCreateWeightEntry,
  useUpdateWeightEntry,
} from "@/lib/hooks/use-weight";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface WeightFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryId?: string;
  defaultDate?: string;
}

interface WeightFormValues {
  date: string;
  weight_kg: string;
  body_fat_percentage: string;
  notes: string;
}

function toOptNum(val: string): number | undefined {
  if (val === "") return undefined;
  const n = Number(val);
  if (isNaN(n)) return undefined;
  return n;
}

export function WeightFormSheet({ open, onOpenChange, entryId, defaultDate }: WeightFormSheetProps) {
  const isEdit = !!entryId;
  const { data: entry, isLoading } = useWeightEntry(entryId ?? "");
  const createMutation = useCreateWeightEntry();
  const updateMutation = useUpdateWeightEntry(entryId ?? "");

  const mutation = isEdit ? updateMutation : createMutation;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="sm" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar peso" : "Registrar peso"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Modifica el registro de peso."
              : "Registra tu peso y porcentaje de grasa corporal."}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          {isEdit && isLoading ? (
            <div className="space-y-4 max-w-sm">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <WeightForm
              key={entryId ?? "new"}
              defaultValues={isEdit ? entry : undefined}
              defaultDate={defaultDate}
              onSubmit={(data) => {
                mutation.mutate(data, {
                  onSuccess: () => {
                    toast.success(isEdit ? "Peso actualizado" : "Peso registrado");
                    onOpenChange(false);
                  },
                  onError: (err) => toast.error(err.message),
                });
              }}
              isLoading={mutation.isPending}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function WeightForm({
  defaultValues,
  defaultDate,
  onSubmit,
  isLoading,
}: {
  defaultValues?: { date: string; weight_kg: number; body_fat_percentage?: number; notes: string };
  defaultDate?: string;
  onSubmit: (data: { date: string; weight_kg: number; body_fat_percentage?: number; notes?: string }) => void;
  isLoading: boolean;
}) {
  const { date: globalDate } = useDate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WeightFormValues>({
    defaultValues: {
      date: defaultValues?.date ?? defaultDate ?? globalDate,
      weight_kg: defaultValues?.weight_kg?.toString() ?? "",
      body_fat_percentage: defaultValues?.body_fat_percentage?.toString() ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  function onFormSubmit(values: WeightFormValues) {
    onSubmit({
      date: values.date,
      weight_kg: Number(values.weight_kg),
      body_fat_percentage: toOptNum(values.body_fat_percentage),
      notes: values.notes || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 max-w-sm">
      <div className="space-y-2">
        <Label htmlFor="weight_kg">Peso (kg)</Label>
        <Input
          id="weight_kg"
          type="number"
          step="0.1"
          min="30"
          max="500"
          {...register("weight_kg", {
            required: "El peso es obligatorio",
            min: { value: 30, message: "Minimo 30 kg" },
            max: { value: 500, message: "Maximo 500 kg" },
          })}
        />
        {errors.weight_kg && (
          <p className="text-sm text-destructive">{errors.weight_kg.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="body_fat_percentage">Grasa corporal (%)</Label>
        <Input
          id="body_fat_percentage"
          type="number"
          step="0.1"
          min="0"
          max="100"
          {...register("body_fat_percentage", {
            min: { value: 0, message: "Minimo 0%" },
            max: { value: 100, message: "Maximo 100%" },
          })}
        />
        {errors.body_fat_percentage && (
          <p className="text-sm text-destructive">{errors.body_fat_percentage.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" rows={2} {...register("notes")} />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Guardando..." : "Guardar"}
      </Button>
    </form>
  );
}
