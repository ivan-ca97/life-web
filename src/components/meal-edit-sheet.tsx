"use client";

import { toast } from "sonner";
import { useMeal, useUpdateMeal } from "@/lib/hooks/use-meals";
import { MealForm } from "@/components/meal-form";
import { FormSkeleton } from "@/components/loading-skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface MealEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealId: string;
}

export function MealEditSheet({ open, onOpenChange, mealId }: MealEditSheetProps) {
  const { data: meal, isLoading } = useMeal(mealId);
  const mutation = useUpdateMeal(mealId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="xl" className="overflow-y-auto" keepMounted>
        <SheetHeader>
          <SheetTitle>Editar comida</SheetTitle>
          <SheetDescription>Modifica los datos de la comida.</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          {isLoading || !meal ? (
            <FormSkeleton />
          ) : (
            <MealForm
              key={mealId}
              defaultValues={meal}
              isLoading={mutation.isPending}
              onSubmit={(data) => {
                mutation.mutate(data, {
                  onSuccess: () => {
                    toast.success("Comida actualizada");
                    onOpenChange(false);
                  },
                  onError: (err) => toast.error(err.message),
                });
              }}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
