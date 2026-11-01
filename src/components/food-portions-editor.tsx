"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  useAddFoodPortion,
  useUpdateFoodPortion,
  useDeleteFoodPortion,
} from "@/lib/hooks/use-foods";
import type { Portion } from "@/lib/types/food";

interface FoodPortionsEditorProps {
  foodId: string;
  /** The food's owner; the portions are edited through their foods. */
  ownerId?: string;
  portions: Portion[];
  baseUnit: string;
}

interface PortionDraft {
  name: string;
  base_equivalent: string;
}

function toDraft(portion: Portion): PortionDraft {
  return { name: portion.name, base_equivalent: portion.base_equivalent.toString() };
}

function isValid(draft: PortionDraft): boolean {
  return draft.name.trim() !== "" && Number(draft.base_equivalent) > 0;
}

/** Each change is saved on its own, apart from the rest of the food form. */
export function FoodPortionsEditor({ foodId, ownerId, portions, baseUnit }: FoodPortionsEditorProps) {
  const [drafts, setDrafts] = useState<Record<string, PortionDraft>>({});
  const [newPortion, setNewPortion] = useState<PortionDraft | null>(null);
  const addMutation = useAddFoodPortion(foodId, ownerId);
  const updateMutation = useUpdateFoodPortion(foodId, ownerId);
  const deleteMutation = useDeleteFoodPortion(foodId, ownerId);

  function draftOf(portion: Portion): PortionDraft {
    return drafts[portion.id] ?? toDraft(portion);
  }

  function isChanged(portion: Portion): boolean {
    const draft = draftOf(portion);
    return (
      draft.name.trim() !== portion.name ||
      Number(draft.base_equivalent) !== portion.base_equivalent
    );
  }

  function handleChange(portion: Portion, field: keyof PortionDraft, value: string) {
    setDrafts({ ...drafts, [portion.id]: { ...draftOf(portion), [field]: value } });
  }

  function forgetDraft(portionId: string) {
    const rest = { ...drafts };
    delete rest[portionId];
    setDrafts(rest);
  }

  function handleSave(portion: Portion) {
    const draft = draftOf(portion);
    updateMutation.mutate(
      {
        portionId: portion.id,
        data: { name: draft.name.trim(), base_equivalent: Number(draft.base_equivalent) },
      },
      {
        onSuccess: () => {
          forgetDraft(portion.id);
          toast.success("Porción actualizada");
        },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  function handleDelete(portion: Portion) {
    deleteMutation.mutate(portion.id, {
      onSuccess: () => {
        forgetDraft(portion.id);
        toast.success("Porción eliminada");
      },
      onError: (err) => toast.error(err.message),
    });
  }

  function handleAdd() {
    if (!newPortion) return;
    addMutation.mutate(
      { name: newPortion.name.trim(), base_equivalent: Number(newPortion.base_equivalent) },
      {
        onSuccess: () => {
          setNewPortion(null);
          toast.success("Porción agregada");
        },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Porciones</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setNewPortion({ name: "", base_equivalent: "" })}
          disabled={newPortion !== null}
        >
          <Plus className="size-4 mr-1" />
          Agregar
        </Button>
      </div>
      {portions.length === 0 && !newPortion && (
        <p className="text-sm text-muted-foreground">Sin porciones. Ej: 1 taza = 240 ml</p>
      )}
      <div className="space-y-2">
        {portions.map((portion) => {
          const draft = draftOf(portion);
          return (
            <Card key={portion.id}>
              <CardContent className="p-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Nombre (ej: taza)"
                    value={draft.name}
                    onChange={(e) => handleChange(portion, "name", e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground shrink-0">=</span>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Cantidad"
                    value={draft.base_equivalent}
                    onChange={(e) => handleChange(portion, "base_equivalent", e.target.value)}
                    className="w-24"
                  />
                  <span className="text-sm font-medium shrink-0">{baseUnit}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    title="Guardar porción"
                    onClick={() => handleSave(portion)}
                    disabled={!isChanged(portion) || !isValid(draft) || updateMutation.isPending}
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    title="Eliminar porción"
                    onClick={() => handleDelete(portion)}
                    disabled={deleteMutation.isPending}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {newPortion && (
          <Card>
            <CardContent className="p-2">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Nombre (ej: taza)"
                  value={newPortion.name}
                  onChange={(e) => setNewPortion({ ...newPortion, name: e.target.value })}
                  className="flex-1"
                  autoFocus
                />
                <span className="text-sm text-muted-foreground shrink-0">=</span>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Cantidad"
                  value={newPortion.base_equivalent}
                  onChange={(e) => setNewPortion({ ...newPortion, base_equivalent: e.target.value })}
                  className="w-24"
                />
                <span className="text-sm font-medium shrink-0">{baseUnit}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  title="Agregar porción"
                  onClick={handleAdd}
                  disabled={!isValid(newPortion) || addMutation.isPending}
                >
                  <Check className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  title="Descartar"
                  onClick={() => setNewPortion(null)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
