"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useFood, useUpdateFood } from "@/lib/hooks/use-foods";
import { FoodForm } from "@/components/food-form";
import { FormSkeleton } from "@/components/loading-skeleton";

export default function EditarAlimentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: food, isLoading } = useFood(id);
  const mutation = useUpdateFood(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Editar alimento</h1>
        <FormSkeleton />
      </div>
    );
  }

  if (!food) {
    return <p className="text-muted-foreground">Alimento no encontrado</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Editar alimento</h1>
      <FoodForm
        defaultValues={food}
        isLoading={mutation.isPending}
        onSubmit={(data) => {
          mutation.mutate(data, {
            onSuccess: () => {
              toast.success("Alimento actualizado");
              router.push("/alimentos");
            },
            onError: (err) => toast.error(err.message),
          });
        }}
      />
    </div>
  );
}
