"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useMeal, useDeleteMeal } from "@/lib/hooks/use-meals";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MacroBar } from "@/components/macro-bar";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CardSkeleton } from "@/components/loading-skeleton";
import { fmtCal, fmtGrams } from "@/lib/format";

export default function ComidaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: meal, isLoading } = useMeal(id);
  const deleteMutation = useDeleteMeal();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!meal) {
    return <p className="text-muted-foreground">Comida no encontrada</p>;
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline">{meal.type}</Badge>
            <span className="text-sm text-muted-foreground">{meal.date}</span>
          </div>
          <h1 className="text-2xl font-semibold">{meal.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href={`/comidas/${meal.id}/editar`} />}>
              <Pencil className="size-4 mr-1" />
              Editar
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="outline">
                <Trash2 className="size-4 mr-1" />
                Eliminar
              </Button>
            }
            title="Eliminar comida"
            description={`Se eliminara "${meal.name}" permanentemente.`}
            onConfirm={() => {
              deleteMutation.mutate(meal.id, {
                onSuccess: () => {
                  toast.success("Comida eliminada");
                  router.push("/comidas");
                },
                onError: (err) => toast.error(err.message),
              });
            }}
            destructive
          />
        </div>
      </div>

      {meal.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {meal.tags.map((t) => (
            <Badge key={t} variant="secondary">{t}</Badge>
          ))}
        </div>
      )}

      {meal.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {meal.items.map((item) => (
                <div key={item.id} className="text-sm space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.food_name}</span>
                    <span className="text-muted-foreground">
                      {item.input_quantity} {item.input_unit}
                      {item.input_unit !== item.normalized_unit &&
                        ` (${item.normalized_quantity} ${item.normalized_unit})`}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {item.calories != null && <span>{fmtCal(item.calories)} kcal</span>}
                    {item.protein_grams != null && <span>{fmtGrams(item.protein_grams)}g prot</span>}
                    {item.carbs_grams != null && <span>{fmtGrams(item.carbs_grams)}g carbs</span>}
                    {item.fat_grams != null && <span>{fmtGrams(item.fat_grams)}g grasa</span>}
                    {item.fiber_grams != null && <span>{fmtGrams(item.fiber_grams)}g fibra</span>}
                    {item.notes && <span>— {item.notes}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(meal.calories != null || meal.protein_grams != null) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Macros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {meal.calories != null && (
                <div>
                  <span className="text-muted-foreground">Calorias:</span>{" "}
                  {fmtCal(meal.calories)} kcal
                </div>
              )}
              {meal.protein_grams != null && (
                <div>
                  <span className="text-muted-foreground">Proteinas:</span>{" "}
                  {fmtGrams(meal.protein_grams)}g
                </div>
              )}
              {meal.carbs_grams != null && (
                <div>
                  <span className="text-muted-foreground">Carbohidratos:</span>{" "}
                  {fmtGrams(meal.carbs_grams)}g
                </div>
              )}
              {meal.fat_grams != null && (
                <div>
                  <span className="text-muted-foreground">Grasas:</span>{" "}
                  {fmtGrams(meal.fat_grams)}g
                </div>
              )}
              {meal.fiber_grams != null && (
                <div>
                  <span className="text-muted-foreground">Fibra:</span>{" "}
                  {fmtGrams(meal.fiber_grams)}g
                </div>
              )}
            </div>
            <MacroBar
              protein={meal.protein_grams ?? 0}
              carbs={meal.carbs_grams ?? 0}
              fat={meal.fat_grams ?? 0}
            />
          </CardContent>
        </Card>
      )}

      {meal.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{meal.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
