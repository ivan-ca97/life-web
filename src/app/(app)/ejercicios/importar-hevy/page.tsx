"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Upload } from "lucide-react";
import { toast } from "sonner";
import { previewHevyCsv } from "@/lib/api/exercises";
import { useApplyHevyProposal } from "@/lib/hooks/use-exercises";
import { formatAr } from "@/lib/datetime";
import { fmtDuration } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { HevyProposal, HevyProposalKind } from "@/lib/types/exercise";

const KIND_LABEL: Record<HevyProposalKind, string> = {
  create: "Nuevo",
  update: "Completa uno cargado",
  unchanged: "Sin cambios",
};

const KIND_VARIANT: Record<HevyProposalKind, "default" | "secondary" | "outline"> = {
  create: "default",
  update: "secondary",
  unchanged: "outline",
};

/** The outcome of each proposal the user acted on, by its position in the list. */
type Outcome = "applied" | "error";

function ProposalCard({
  proposal,
  outcome,
  applying,
  onApply,
}: {
  proposal: HevyProposal;
  outcome?: Outcome;
  applying: boolean;
  onApply: () => void;
}) {
  const applied = outcome === "applied";
  const actionable = proposal.kind !== "unchanged" && !applied;
  return (
    <Card className={applied || proposal.kind === "unchanged" ? "opacity-60" : ""}>
      <CardContent className="space-y-3 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{proposal.title}</span>
          <Badge variant={KIND_VARIANT[proposal.kind]}>{KIND_LABEL[proposal.kind]}</Badge>
          <span className="text-sm text-muted-foreground">
            {formatAr(proposal.started_at, "dd/MM/yyyy HH:mm")} · {fmtDuration(proposal.duration_seconds)} ·{" "}
            {proposal.total_sets} series
            {proposal.total_volume_kg != null ? ` · ${Math.round(proposal.total_volume_kg).toLocaleString()} kg` : ""}
          </span>
          <div className="ml-auto">
            {applied ? (
              <span className="flex items-center gap-1 text-sm text-primary">
                <Check className="size-4" />
                Aplicado
              </span>
            ) : actionable ? (
              <Button size="sm" onClick={onApply} disabled={applying}>
                {proposal.kind === "create" ? "Crear" : "Completar"}
              </Button>
            ) : null}
          </div>
        </div>
        {proposal.kind === "update" && proposal.current_notes ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Notas actuales (se reemplazan)</p>
              <pre className="whitespace-pre-wrap text-xs rounded-md bg-muted/50 p-2">{proposal.current_notes}</pre>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Notas nuevas</p>
              <pre className="whitespace-pre-wrap text-xs rounded-md bg-muted/50 p-2">{proposal.notes}</pre>
            </div>
          </div>
        ) : (
          <pre className="whitespace-pre-wrap text-xs rounded-md bg-muted/50 p-2">{proposal.notes}</pre>
        )}
      </CardContent>
    </Card>
  );
}

export default function ImportarHevyPage() {
  const [proposals, setProposals] = useState<HevyProposal[] | null>(null);
  const [reading, setReading] = useState(false);
  const [outcomes, setOutcomes] = useState<Record<number, Outcome>>({});
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null);
  const applyMutation = useApplyHevyProposal();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setReading(true);
    try {
      const preview = await previewHevyCsv(file);
      setProposals(preview.items ?? []);
      setOutcomes({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo leer el archivo");
    } finally {
      setReading(false);
    }
  }

  function handleApply(index: number, proposal: HevyProposal) {
    setApplyingIndex(index);
    applyMutation.mutate(proposal, {
      onSuccess: () => setOutcomes((prev) => ({ ...prev, [index]: "applied" })),
      onError: (err) => {
        setOutcomes((prev) => ({ ...prev, [index]: "error" }));
        toast.error(`${proposal.title} del ${proposal.date}: ${err.message}`);
      },
      onSettled: () => setApplyingIndex(null),
    });
  }

  const pending = (proposals ?? []).filter((p, i) => p.kind !== "unchanged" && outcomes[i] !== "applied").length;

  return (
    <div className="space-y-4 max-w-3xl">
      <Button variant="ghost" size="sm" render={<Link href="/ejercicios" />}>
        <ArrowLeft className="size-4 mr-1" />
        Ejercicios
      </Button>
      <div>
        <h1 className="text-2xl font-semibold">Importar de Hevy</h1>
        <p className="text-sm text-muted-foreground">
          Subi el CSV que exporta Hevy. Nada cambia hasta que aceptes cada entrenamiento.
        </p>
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-2">
        <Input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <span className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-muted">
          <Upload className="size-4" />
          {reading ? "Leyendo..." : proposals ? "Elegir otro archivo" : "Elegir archivo"}
        </span>
      </label>

      {proposals && (
        <p className="text-sm text-muted-foreground">
          {proposals.length} entrenamientos, de los mas recientes a los mas antiguos. Quedan {pending} por aplicar.
        </p>
      )}

      <div className="space-y-3">
        {(proposals ?? []).map((proposal, index) => (
          <ProposalCard
            key={`${proposal.started_at}-${proposal.title}`}
            proposal={proposal}
            outcome={outcomes[index]}
            applying={applyingIndex === index}
            onApply={() => handleApply(index, proposal)}
          />
        ))}
      </div>
    </div>
  );
}
