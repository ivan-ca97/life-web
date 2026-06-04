"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useDate } from "@/lib/date/context";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useExercises, useDeleteExercise } from "@/lib/hooks/use-exercises";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PaginationControls } from "@/components/pagination-controls";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { ListSkeleton } from "@/components/loading-skeleton";
import { ExerciseFormSheet } from "@/components/exercise-form-sheet";
import { fmtCal, fmtDuration } from "@/lib/format";

const typeLabels: Record<string, string> = {
  weightlifting: "Pesas",
  walking: "Caminata",
  cycling: "Ciclismo",
  running: "Carrera",
  other: "Otro",
  manual_adjustment: "Ajuste manual",
};

export default function EjerciciosPage() {
  const { date } = useDate();
  const [offset, setOffset] = useState(0);

  useEffect(() => { setOffset(0); }, [date]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const limit = 20;

  const { data, isLoading } = useExercises({ date, limit, offset });
  const deleteMutation = useDeleteExercise();

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Ejercicio eliminado"),
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ejercicios</h1>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus className="size-4 mr-1" />
          Nuevo
        </Button>
      </div>

      {isLoading ? (
        <ListSkeleton count={5} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          message="No hay ejercicios registrados"
          action={{ label: "Registrar ejercicio", onClick: () => setSheetOpen(true) }}
        />
      ) : (
        <>
          <div className="grid gap-3">
            {data.items.filter((e) => e.type !== "manual_adjustment").map((exercise) => (
              <Card key={exercise.id}>
                <CardContent className="flex items-start justify-between p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {typeLabels[exercise.type] ?? exercise.type}
                      </Badge>
                      {exercise.started_at && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {exercise.started_at.slice(11, 16)}
                          {exercise.started_at.slice(0, 10) !== exercise.date && (
                            <span className="ml-0.5 text-[10px] align-super opacity-60">+1d</span>
                          )}
                        </span>
                      )}
                      {exercise.name && <span className="font-medium">{exercise.name}</span>}
                      {exercise.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                    {(() => {
                      const parts: string[] = [];
                      if (exercise.duration_seconds != null) parts.push(fmtDuration(exercise.duration_seconds));
                      if (exercise.estimated_calories_burned != null) parts.push(`${fmtCal(exercise.estimated_calories_burned)} kcal`);
                      if (exercise.distance_meters != null) parts.push(`${(exercise.distance_meters / 1000).toFixed(2)} km`);
                      if (exercise.steps != null) parts.push(`${exercise.steps.toLocaleString()} pasos`);
                      if (exercise.total_volume_kg != null) parts.push(`${exercise.total_volume_kg.toLocaleString()} kg vol`);
                      if (exercise.total_sets != null) parts.push(`${exercise.total_sets} series`);
                      if (parts.length === 0) return null;
                      return <p className="text-sm text-muted-foreground mt-1">{parts.join(" · ")}</p>;
                    })()}
                    {exercise.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {exercise.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 ml-4 shrink-0">
                    <Button variant="ghost" size="icon" render={<Link href={`/ejercicios/${exercise.id}`} />}>
                        <Eye className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" render={<Link href={`/ejercicios/${exercise.id}/editar`} />}>
                        <Pencil className="size-4" />
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Trash2 className="size-4" />
                        </Button>
                      }
                      title="Eliminar ejercicio"
                      description={`Se eliminara "${exercise.name}" permanentemente.`}
                      onConfirm={() => handleDelete(exercise.id)}
                      destructive
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <PaginationControls
            total={data.total}
            limit={data.limit}
            offset={offset}
            onPageChange={setOffset}
          />
        </>
      )}
      <ExerciseFormSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
