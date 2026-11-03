"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useAiInstructions,
  useCreateAiInstruction,
  useDeleteAiInstruction,
  useUpdateAiInstruction,
} from "@/lib/hooks/use-ai-instructions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { AiInstruction } from "@/lib/types/ai-instruction";

const LABEL_LIMIT = 40;
const TEXT_LIMIT = 300;

interface Draft {
  label: string;
  text: string;
  always_on: boolean;
}

const EMPTY: Draft = { label: "", text: "", always_on: false };

function InstructionForm({
  initial,
  saving,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: Draft;
  saving: boolean;
  submitLabel: string;
  onSubmit: (draft: Draft) => void;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const valid = draft.label.trim() !== "" && draft.text.trim() !== "";
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="instruction-label">Nombre corto</Label>
        <Input
          id="instruction-label"
          placeholder="Ej: Plato 27 cm"
          maxLength={LABEL_LIMIT}
          value={draft.label}
          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="instruction-text">Lo que lee el asistente</Label>
        <Textarea
          id="instruction-text"
          placeholder="Ej: El plato llano mide 27 cm de diametro; si aparece en la foto, usalo como escala para las porciones."
          maxLength={TEXT_LIMIT}
          value={draft.text}
          onChange={(e) => setDraft({ ...draft, text: e.target.value })}
        />
        <p className="text-xs text-muted-foreground text-right">
          {draft.text.length}/{TEXT_LIMIT}
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={draft.always_on}
          onChange={(e) => setDraft({ ...draft, always_on: e.target.checked })}
        />
        Siempre activa: va en todas las estimaciones sin elegirla
      </label>
      <div className="flex gap-2">
        <Button onClick={() => onSubmit(draft)} disabled={!valid || saving}>
          {saving ? "Guardando..." : submitLabel}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}

function InstructionRow({ instruction }: { instruction: AiInstruction }) {
  const [editing, setEditing] = useState(false);
  const updateMutation = useUpdateAiInstruction();
  const deleteMutation = useDeleteAiInstruction();

  if (editing) {
    return (
      <div className="px-4 py-3">
        <InstructionForm
          initial={{ label: instruction.label, text: instruction.text, always_on: instruction.always_on }}
          saving={updateMutation.isPending}
          submitLabel="Guardar"
          onCancel={() => setEditing(false)}
          onSubmit={(draft) =>
            updateMutation.mutate(
              { id: instruction.id, data: draft },
              {
                onSuccess: () => setEditing(false),
                onError: (err) => toast.error(err.message),
              },
            )
          }
        />
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{instruction.label}</span>
          {instruction.always_on && <Badge variant="secondary">Siempre activa</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{instruction.text}</p>
      </div>
      <label className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={instruction.always_on}
          onChange={(e) =>
            updateMutation.mutate(
              { id: instruction.id, data: { always_on: e.target.checked } },
              { onError: (err) => toast.error(err.message) },
            )
          }
        />
        Siempre
      </label>
      <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)} title="Editar">
        <Pencil className="size-4" />
      </Button>
      <ConfirmDialog
        trigger={
          <Button variant="ghost" size="icon-sm" title="Borrar">
            <Trash2 className="size-4" />
          </Button>
        }
        title="Borrar indicacion"
        description={`Se borrara "${instruction.label}".`}
        onConfirm={() => deleteMutation.mutate(instruction.id, { onError: (err) => toast.error(err.message) })}
        destructive
      />
    </div>
  );
}

export default function AsistentePage() {
  const { data, isLoading } = useAiInstructions();
  const createMutation = useCreateAiInstruction();
  const [adding, setAdding] = useState(false);
  const instructions = data?.items ?? [];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Asistente IA</h1>
        <p className="text-sm text-muted-foreground">
          Indicaciones que escribis una vez y reusas al analizar comidas. Las siempre activas van en todas las
          estimaciones; las demas las elegis cada vez. Si algo que escribas en el momento las contradice, gana lo que
          escribiste.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Tus indicaciones ({instructions.length})</CardTitle>
          {!adding && (
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus className="size-4 mr-1" />
              Nueva
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border">
          {adding && (
            <div className="px-4 py-3">
              <InstructionForm
                initial={EMPTY}
                saving={createMutation.isPending}
                submitLabel="Crear"
                onCancel={() => setAdding(false)}
                onSubmit={(draft) =>
                  createMutation.mutate(draft, {
                    onSuccess: () => setAdding(false),
                    onError: (err) => toast.error(err.message),
                  })
                }
              />
            </div>
          )}
          {isLoading ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">Cargando...</p>
          ) : instructions.length === 0 && !adding ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              Todavia no tenes indicaciones. Ej: &quot;Plato 27 cm&quot;, &quot;Sin aceite&quot;, &quot;A la
              parrilla&quot;.
            </p>
          ) : (
            instructions.map((instruction) => <InstructionRow key={instruction.id} instruction={instruction} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
