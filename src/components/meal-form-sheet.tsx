"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCreateMeal } from "@/lib/hooks/use-meals";
import { MealForm } from "@/components/meal-form";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface MealFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MealFormSheet({ open, onOpenChange }: MealFormSheetProps) {
  const mutation = useCreateMeal();
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (open) setFormKey((k) => k + 1);
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="xl" className="overflow-y-auto" keepMounted>
        <SheetHeader>
          <SheetTitle>Nueva comida</SheetTitle>
          <SheetDescription>Registra una comida con sus alimentos y macros.</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          <MealForm
            key={formKey}
            onSubmit={(data) => {
              mutation.mutate(data, {
                onSuccess: () => {
                  toast.success("Comida registrada");
                  onOpenChange(false);
                  setFormKey((k) => k + 1);
                },
                onError: (err) => toast.error(err.message),
              });
            }}
            isLoading={mutation.isPending}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
