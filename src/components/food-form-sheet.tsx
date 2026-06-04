"use client";

import { toast } from "sonner";
import { useFood, useCreateFood, useUpdateFood } from "@/lib/hooks/use-foods";
import { FoodForm } from "@/components/food-form";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface FoodFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  foodId?: string;
}

export function FoodFormSheet({ open, onOpenChange, foodId }: FoodFormSheetProps) {
  const isEdit = !!foodId;
  const { data: food, isLoading } = useFood(foodId ?? "");
  const createMutation = useCreateFood();
  const updateMutation = useUpdateFood(foodId ?? "");

  const mutation = isEdit ? updateMutation : createMutation;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="lg" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar alimento" : "Nuevo alimento"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Modifica los datos del alimento."
              : "Registra un alimento con sus valores nutricionales."}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          {isEdit && isLoading ? (
            <div className="space-y-4 max-w-lg">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <FoodForm
              key={foodId ?? "new"}
              defaultValues={isEdit ? food : undefined}
              onSubmit={(data) => {
                mutation.mutate(data, {
                  onSuccess: () => {
                    toast.success(isEdit ? "Alimento actualizado" : "Alimento creado");
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
