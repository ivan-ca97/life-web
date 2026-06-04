"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useExercise, useUpdateExercise } from "@/lib/hooks/use-exercises";
import { ExerciseForm } from "@/components/exercise-form";
import { FormSkeleton } from "@/components/loading-skeleton";

export default function EditarEjercicioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: exercise, isLoading } = useExercise(id);
  const mutation = useUpdateExercise(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Editar ejercicio</h1>
        <FormSkeleton />
      </div>
    );
  }

  if (!exercise) {
    return <p className="text-muted-foreground">Ejercicio no encontrado</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Editar ejercicio</h1>
      <ExerciseForm
        defaultValues={exercise}
        isLoading={mutation.isPending}
        onSubmit={(data) => {
          mutation.mutate(data, {
            onSuccess: () => {
              toast.success("Ejercicio actualizado");
              router.push(`/ejercicios/${id}`);
            },
            onError: (err) => toast.error(err.message),
          });
        }}
      />
    </div>
  );
}
