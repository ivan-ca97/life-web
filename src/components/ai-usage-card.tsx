"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMyAiUsage, useSetAiSelfLimit } from "@/lib/hooks/use-ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AiUsageCard() {
  const { data: usage, isLoading } = useMyAiUsage();
  const setLimit = useSetAiSelfLimit();
  const [limitInput, setLimitInput] = useState("");

  if (isLoading || !usage) return null;

  const limit = usage.effective_limit_usd;
  const pct =
    limit != null && limit > 0 ? Math.min(100, Math.round((usage.cost_usd / limit) * 100)) : null;

  function save() {
    const raw = limitInput.trim();
    const value = raw === "" ? null : Number(raw);
    if (value !== null && (isNaN(value) || value < 0)) {
      toast.error("Ingresa un monto valido en USD.");
      return;
    }
    setLimit.mutate(value, {
      onSuccess: () => {
        toast.success(value == null ? "Auto-limite quitado" : "Auto-limite actualizado");
        setLimitInput("");
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : "No se pudo actualizar"),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="size-4" /> Asistente de IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Consumo del mes · {usage.tier_name}</span>
            <span className="tabular-nums font-medium">
              ${usage.cost_usd.toFixed(2)}
              {limit != null ? ` / $${limit.toFixed(2)}` : " (sin tope)"}
            </span>
          </div>
          {pct != null && (
            <div className="mt-1.5 h-2 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
          )}
          <div className="mt-1 text-xs text-muted-foreground">
            {usage.requests} estimacion{usage.requests === 1 ? "" : "es"} este mes
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ai-self-limit">Auto-limite mensual (USD)</Label>
          <div className="flex gap-2">
            <Input
              id="ai-self-limit"
              type="number"
              step="any"
              min="0"
              placeholder="Ej: 5.00 (vacio = sin auto-limite)"
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
            />
            <Button variant="outline" onClick={save} disabled={setLimit.isPending}>
              {setLimit.isPending ? <Loader2 className="size-4 animate-spin" /> : "Guardar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            El tope efectivo es el menor entre el limite de tu tier y este auto-limite.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
