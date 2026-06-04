"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMeal, useUpdateMeal } from "@/lib/hooks/use-meals";
import { MealForm } from "@/components/meal-form";
import { FormSkeleton } from "@/components/loading-skeleton";

export default function EditarComidaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: meal, isLoading } = useMeal(id);
  const mutation = useUpdateMeal(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Editar comida</h1>
        <FormSkeleton />
      </div>
    );
  }

  if (!meal) {
    return <p className="text-muted-foreground">Comida no encontrada</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Editar comida</h1>
      <MealForm
        defaultValues={meal}
        isLoading={mutation.isPending}
        onSubmit={(data) => {
          mutation.mutate(data, {
            onSuccess: () => {
              toast.success("Comida actualizada");
              router.push(`/comidas/${id}`);
            },
            onError: (err) => toast.error(err.message),
          });
        }}
      />
    </div>
  );
}
