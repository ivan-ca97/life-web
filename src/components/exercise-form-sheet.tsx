"use client";

import { toast } from "sonner";
import { useCreateExercise } from "@/lib/hooks/use-exercises";
import { ExerciseForm } from "@/components/exercise-form";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface ExerciseFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExerciseFormSheet({ open, onOpenChange }: ExerciseFormSheetProps) {
  const mutation = useCreateExercise();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="lg" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nuevo ejercicio</SheetTitle>
          <SheetDescription>Registra una actividad fisica.</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          <ExerciseForm
            onSubmit={(data) => {
              mutation.mutate(data, {
                onSuccess: () => {
                  toast.success("Ejercicio registrado");
                  onOpenChange(false);
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
