"use client";

import { useState } from "react";
import { Sparkles, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useAiTiers,
  useCreateAiTier,
  useUpdateAiTier,
  useAssignUserTier,
  useUserAiUsage,
} from "@/lib/hooks/use-ai";
import { useUsers } from "@/lib/hooks/use-users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ListSkeleton } from "@/components/loading-skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AiTier } from "@/lib/types/ai";

function limitLabel(l: number | null): string {
  return l == null ? "Ilimitado" : `$${l.toFixed(2)}/mes`;
}

function TierRow({ tier }: { tier: AiTier }) {
  const update = useUpdateAiTier();
  const [name, setName] = useState(tier.name);
  const [limit, setLimit] = useState(tier.monthly_limit_usd == null ? "" : String(tier.monthly_limit_usd));
  const [enabled, setEnabled] = useState(tier.enabled);

  function save() {
    const raw = limit.trim();
    const num = raw === "" ? null : Number(raw);
    if (num !== null && (isNaN(num) || num < 0)) {
      toast.error("Limite invalido.");
      return;
    }
    update.mutate(
      {
        tierId: tier.id,
        data:
          num == null
            ? { name: name.trim(), enabled, unlimited: true }
            : { name: name.trim(), enabled, monthly_limit_usd: num },
      },
      {
        onSuccess: () => toast.success("Tier actualizado"),
        onError: (err) => toast.error(err instanceof Error ? err.message : "No se pudo actualizar"),
      }
    );
  }

  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{tier.name}</span>
          {tier.is_default && <Badge variant="secondary" className="text-xs">default</Badge>}
          {!tier.enabled && <Badge variant="outline" className="text-xs">deshabilitado</Badge>}
          <span className="text-xs text-muted-foreground ml-auto">{limitLabel(tier.monthly_limit_usd)}</span>
        </div>
        <div className="flex items-end gap-2 flex-wrap">
          <div className="space-y-1">
            <Label className="text-xs">Nombre</Label>
            <Input className="h-8 w-36" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Limite USD/mes</Label>
            <Input
              className="h-8 w-32"
              type="number"
              step="any"
              min="0"
              placeholder="vacio = ilimitado"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-1.5 text-sm h-8">
            <input type="checkbox" className="size-4 accent-primary" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            Habilitado
          </label>
          <Button size="sm" variant="outline" onClick={save} disabled={update.isPending}>
            {update.isPending ? <Loader2 className="size-4 animate-spin" /> : "Guardar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateTierForm() {
  const create = useCreateAiTier();
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");

  function submit() {
    if (!name.trim()) {
      toast.error("Nombre requerido.");
      return;
    }
    const raw = limit.trim();
    const num = raw === "" ? null : Number(raw);
    if (num !== null && (isNaN(num) || num < 0)) {
      toast.error("Limite invalido.");
      return;
    }
    create.mutate(
      { name: name.trim(), monthly_limit_usd: num, enabled: true },
      {
        onSuccess: () => {
          toast.success("Tier creado");
          setName("");
          setLimit("");
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "No se pudo crear"),
      }
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nuevo tier</CardTitle>
      </CardHeader>
      <CardContent className="flex items-end gap-2 flex-wrap">
        <div className="space-y-1">
          <Label className="text-xs">Nombre</Label>
          <Input className="h-8 w-36" placeholder="pro" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Limite USD/mes</Label>
          <Input className="h-8 w-32" type="number" step="any" min="0" placeholder="vacio = ilimitado" value={limit} onChange={(e) => setLimit(e.target.value)} />
        </div>
        <Button size="sm" onClick={submit} disabled={create.isPending}>
          {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <><Plus className="size-4 mr-1" /> Crear</>}
        </Button>
      </CardContent>
    </Card>
  );
}

function AssignSection({ tiers }: { tiers: AiTier[] }) {
  const { data: usersData } = useUsers({ limit: 100, offset: 0 });
  const assign = useAssignUserTier();
  const [userId, setUserId] = useState("");
  const [tierId, setTierId] = useState("");
  const { data: usage } = useUserAiUsage(userId || undefined);

  const users = usersData?.items ?? [];

  function submit() {
    if (!userId || !tierId) {
      toast.error("Elegi usuario y tier.");
      return;
    }
    assign.mutate(
      { userId, tierId },
      {
        onSuccess: () => toast.success("Tier asignado"),
        onError: (err) => toast.error(err instanceof Error ? err.message : "No se pudo asignar"),
      }
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Asignar tier a usuario</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end gap-2 flex-wrap">
          <div className="space-y-1">
            <Label className="text-xs">Usuario</Label>
            <Select value={userId} onValueChange={(v) => setUserId(v ?? "")}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Elegir usuario" /></SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tier</Label>
            <Select value={tierId} onValueChange={(v) => setTierId(v ?? "")}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Elegir tier" /></SelectTrigger>
              <SelectContent>
                {tiers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={submit} disabled={assign.isPending}>
            {assign.isPending ? <Loader2 className="size-4 animate-spin" /> : "Asignar"}
          </Button>
        </div>
        {userId && usage && (
          <p className="text-xs text-muted-foreground">
            Consumo de este usuario: ${usage.cost_usd.toFixed(2)}
            {usage.effective_limit_usd != null ? ` / $${usage.effective_limit_usd.toFixed(2)}` : " (sin tope)"} ·{" "}
            {usage.requests} estimaciones · tier {usage.tier_name}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AiTiersPage() {
  const { data, isLoading, error } = useAiTiers();
  const tiers = data?.items ?? [];

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <Sparkles className="size-5" /> IA — Tiers y cuotas
      </h1>

      {isLoading ? (
        <ListSkeleton />
      ) : error ? (
        <p className="text-sm text-muted-foreground">
          No se pudieron cargar los tiers (necesitas rol admin).
        </p>
      ) : (
        <>
          <CreateTierForm />
          <div className="space-y-2">
            {tiers.map((t) => (
              <TierRow key={t.id} tier={t} />
            ))}
          </div>
          <AssignSection tiers={tiers} />
        </>
      )}
    </div>
  );
}
