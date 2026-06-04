"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateExercise } from "@/lib/hooks/use-exercises";
import { ExerciseForm } from "@/components/exercise-form";

export default function NuevoEjercicioPage() {
  const router = useRouter();
  const mutation = useCreateExercise();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Nuevo ejercicio</h1>
      <ExerciseForm
        isLoading={mutation.isPending}
        onSubmit={(data) => {
          mutation.mutate(data, {
            onSuccess: () => {
              toast.success("Ejercicio creado");
              router.push("/ejercicios");
            },
            onError: (err) => toast.error(err.message),
          });
        }}
      />
    </div>
  );
}
