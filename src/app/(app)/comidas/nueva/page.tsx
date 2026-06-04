"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateMeal } from "@/lib/hooks/use-meals";
import { MealForm } from "@/components/meal-form";

export default function NuevaComidaPage() {
  const router = useRouter();
  const mutation = useCreateMeal();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Nueva comida</h1>
      <MealForm
        isLoading={mutation.isPending}
        onSubmit={(data) => {
          mutation.mutate(data, {
            onSuccess: () => {
              toast.success("Comida creada");
              router.push("/comidas");
            },
            onError: (err) => toast.error(err.message),
          });
        }}
      />
    </div>
  );
}
