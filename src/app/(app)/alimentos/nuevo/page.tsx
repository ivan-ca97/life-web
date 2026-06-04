"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateFood } from "@/lib/hooks/use-foods";
import { FoodForm } from "@/components/food-form";

export default function NuevoAlimentoPage() {
  const router = useRouter();
  const mutation = useCreateFood();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Nuevo alimento</h1>
      <FoodForm
        isLoading={mutation.isPending}
        onSubmit={(data) => {
          mutation.mutate(data, {
            onSuccess: () => {
              toast.success("Alimento creado");
              router.push("/alimentos");
            },
            onError: (err) => toast.error(err.message),
          });
        }}
      />
    </div>
  );
}
