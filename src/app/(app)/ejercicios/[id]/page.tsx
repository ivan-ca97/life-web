"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useExercise, useDeleteExercise } from "@/lib/hooks/use-exercises";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CardSkeleton } from "@/components/loading-skeleton";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { fmtCal, fmtDuration } from "@/lib/format";

const typeLabels: Record<string, string> = {
  weightlifting: "Pesas",
  walking: "Caminata",
  cycling: "Ciclismo",
  running: "Carrera",
  other: "Otro",
  manual_adjustment: "Ajuste manual",
};

export default function EjercicioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: exercise, isLoading } = useExercise(id);
  const deleteMutation = useDeleteExercise();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!exercise) {
    return <p className="text-muted-foreground">Ejercicio no encontrado</p>;
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline">
              {typeLabels[exercise.type] ?? exercise.type}
            </Badge>
            <span className="text-sm text-muted-foreground capitalize">
              {format(parse(exercise.date, "yyyy-MM-dd", new Date()), "EEEE, yyyy-MM-dd", { locale: es })}
            </span>
          </div>
          {exercise.name && <h1 className="text-2xl font-semibold">{exercise.name}</h1>}
          {exercise.tags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {exercise.tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href={`/ejercicios/${exercise.id}/editar`} />}>
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
            title="Eliminar ejercicio"
            description={`Se eliminara "${exercise.name}" permanentemente.`}
            onConfirm={() => {
              deleteMutation.mutate(exercise.id, {
                onSuccess: () => {
                  toast.success("Ejercicio eliminado");
                  router.push("/ejercicios");
                },
                onError: (err) => toast.error(err.message),
              });
            }}
            destructive
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metricas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {exercise.duration_seconds != null && (
              <div>
                <span className="text-muted-foreground">Duracion:</span>{" "}
                {fmtDuration(exercise.duration_seconds)}
              </div>
            )}
            {exercise.estimated_calories_burned != null && (
              <div>
                <span className="text-muted-foreground">Calorias:</span>{" "}
                {fmtCal(exercise.estimated_calories_burned)} kcal
              </div>
            )}
            {exercise.steps != null && (
              <div>
                <span className="text-muted-foreground">Pasos:</span>{" "}
                {exercise.steps.toLocaleString()}
              </div>
            )}
            {exercise.distance_meters != null && (
              <div>
                <span className="text-muted-foreground">Distancia:</span>{" "}
                {(exercise.distance_meters / 1000).toFixed(1)} km
              </div>
            )}
            {exercise.average_speed_kmh != null && (
              <div>
                <span className="text-muted-foreground">Vel. media:</span>{" "}
                {exercise.average_speed_kmh.toFixed(1)} km/h
              </div>
            )}
            {exercise.max_speed_kmh != null && (
              <div>
                <span className="text-muted-foreground">Vel. max:</span>{" "}
                {exercise.max_speed_kmh.toFixed(1)} km/h
              </div>
            )}
            {exercise.average_pace_min_per_km != null && (
              <div>
                <span className="text-muted-foreground">Ritmo:</span>{" "}
                {exercise.average_pace_min_per_km.toFixed(1)} min/km
              </div>
            )}
            {exercise.average_heart_rate != null && (
              <div>
                <span className="text-muted-foreground">FC media:</span>{" "}
                {Math.round(exercise.average_heart_rate)} bpm
              </div>
            )}
            {exercise.max_heart_rate != null && (
              <div>
                <span className="text-muted-foreground">FC max:</span>{" "}
                {Math.round(exercise.max_heart_rate)} bpm
              </div>
            )}
            {exercise.elevation_gain_meters != null && (
              <div>
                <span className="text-muted-foreground">Desnivel:</span>{" "}
                {exercise.elevation_gain_meters.toFixed(1)} m
              </div>
            )}
            {exercise.total_volume_kg != null && (
              <div>
                <span className="text-muted-foreground">Volumen:</span>{" "}
                {exercise.total_volume_kg.toLocaleString()} kg
              </div>
            )}
            {exercise.total_sets != null && (
              <div>
                <span className="text-muted-foreground">Series:</span>{" "}
                {exercise.total_sets}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {exercise.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{exercise.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
