"use client";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useGoals, useUpsertGoals } from "@/lib/hooks/use-goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface GoalFormValues {
  daily_calories: string;
  daily_protein_grams: string;
  daily_carbs_grams: string;
  daily_fat_grams: string;
  daily_fiber_grams: string;
  daily_steps: string;
  daily_exercise_minutes: string;
  target_weight_kg: string;
}

function toOptNum(val: string): number | undefined {
  if (val === "") return undefined;
  const n = Number(val);
  if (isNaN(n)) return undefined;
  return n;
}

export default function MetasPage() {
  const { data: goals, isLoading } = useGoals();
  const mutation = useUpsertGoals();

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-lg">
        <h1 className="text-2xl font-semibold">Metas</h1>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Metas</h1>
      <GoalForm
        key={goals?.id ?? "empty"}
        defaultValues={goals}
        onSubmit={(data) => {
          mutation.mutate(data, {
            onSuccess: () => toast.success("Metas actualizadas"),
            onError: (err) => toast.error(err.message),
          });
        }}
        isLoading={mutation.isPending}
      />
    </div>
  );
}

function GoalForm({
  defaultValues,
  onSubmit,
  isLoading,
}: {
  defaultValues?: {
    daily_calories?: number;
    daily_protein_grams?: number;
    daily_carbs_grams?: number;
    daily_fat_grams?: number;
    daily_fiber_grams?: number;
    daily_steps?: number;
    daily_exercise_minutes?: number;
    target_weight_kg?: number;
  };
  onSubmit: (data: {
    daily_calories?: number;
    daily_protein_grams?: number;
    daily_carbs_grams?: number;
    daily_fat_grams?: number;
    daily_fiber_grams?: number;
    daily_steps?: number;
    daily_exercise_minutes?: number;
    target_weight_kg?: number;
  }) => void;
  isLoading: boolean;
}) {
  const { register, handleSubmit } = useForm<GoalFormValues>({
    defaultValues: {
      daily_calories: defaultValues?.daily_calories?.toString() ?? "",
      daily_protein_grams: defaultValues?.daily_protein_grams?.toString() ?? "",
      daily_carbs_grams: defaultValues?.daily_carbs_grams?.toString() ?? "",
      daily_fat_grams: defaultValues?.daily_fat_grams?.toString() ?? "",
      daily_fiber_grams: defaultValues?.daily_fiber_grams?.toString() ?? "",
      daily_steps: defaultValues?.daily_steps?.toString() ?? "",
      daily_exercise_minutes: defaultValues?.daily_exercise_minutes?.toString() ?? "",
      target_weight_kg: defaultValues?.target_weight_kg?.toString() ?? "",
    },
  });

  function onFormSubmit(values: GoalFormValues) {
    onSubmit({
      daily_calories: toOptNum(values.daily_calories),
      daily_protein_grams: toOptNum(values.daily_protein_grams),
      daily_carbs_grams: toOptNum(values.daily_carbs_grams),
      daily_fat_grams: toOptNum(values.daily_fat_grams),
      daily_fiber_grams: toOptNum(values.daily_fiber_grams),
      daily_steps: toOptNum(values.daily_steps),
      daily_exercise_minutes: toOptNum(values.daily_exercise_minutes),
      target_weight_kg: toOptNum(values.target_weight_kg),
    });
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alimentacion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="daily_calories">Calorias diarias (kcal)</Label>
              <Input
                id="daily_calories"
                type="number"
                step="any"
                min="0"
                {...register("daily_calories")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="daily_protein_grams">Proteinas (g)</Label>
              <Input
                id="daily_protein_grams"
                type="number"
                step="any"
                min="0"
                {...register("daily_protein_grams")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="daily_carbs_grams">Carbohidratos (g)</Label>
              <Input
                id="daily_carbs_grams"
                type="number"
                step="any"
                min="0"
                {...register("daily_carbs_grams")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="daily_fat_grams">Grasas (g)</Label>
              <Input
                id="daily_fat_grams"
                type="number"
                step="any"
                min="0"
                {...register("daily_fat_grams")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="daily_fiber_grams">Fibra (g)</Label>
              <Input
                id="daily_fiber_grams"
                type="number"
                step="any"
                min="0"
                {...register("daily_fiber_grams")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ejercicio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="daily_steps">Pasos diarios</Label>
              <Input
                id="daily_steps"
                type="number"
                min="0"
                {...register("daily_steps")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="daily_exercise_minutes">Minutos de ejercicio</Label>
              <Input
                id="daily_exercise_minutes"
                type="number"
                min="0"
                {...register("daily_exercise_minutes")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Peso objetivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs space-y-2">
            <Label htmlFor="target_weight_kg">Peso objetivo (kg)</Label>
            <Input
              id="target_weight_kg"
              type="number"
              step="0.1"
              min="0"
              {...register("target_weight_kg")}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Guardando..." : "Guardar metas"}
      </Button>
    </form>
  );
}
