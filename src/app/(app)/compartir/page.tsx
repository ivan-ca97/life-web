"use client";

import { useState } from "react";
import { Plus, Trash2, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { toast } from "sonner";
import { formatAr } from "@/lib/datetime";
import {
  useOwnedShares,
  useReceivedShares,
  useCreateShare,
  useUpdateShare,
  useDeleteShare,
} from "@/lib/hooks/use-shares";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Share, ShareResourceType } from "@/lib/types/share";

const RESOURCE_TYPES: { value: ShareResourceType; label: string }[] = [
  { value: "meals", label: "Comidas" },
  { value: "exercises", label: "Ejercicios" },
  { value: "weight", label: "Peso" },
  { value: "foods", label: "Alimentos" },
  { value: "goals", label: "Metas" },
  { value: "daily", label: "Resumen diario" },
];

const RESOURCE_LABELS: Record<string, string> = Object.fromEntries(
  RESOURCE_TYPES.map((r) => [r.value, r.label]),
);

function ShareRow({
  share,
  showEmail,
  onToggleWrite,
  onDelete,
  readonly,
}: {
  share: Share;
  showEmail?: string;
  onToggleWrite?: (canWrite: boolean) => void;
  onDelete?: () => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">{RESOURCE_LABELS[share.resource_type] ?? share.resource_type}</Badge>
          <Badge variant={share.can_write ? "default" : "secondary"} className="text-xs">
            {share.can_write ? "Lectura y escritura" : "Solo lectura"}
          </Badge>
        </div>
        {showEmail && (
          <p className="text-sm text-muted-foreground mt-0.5">{showEmail}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {formatAr(share.created_at, "dd/MM/yyyy")}
        </p>
      </div>
      {!readonly && (
        <div className="flex items-center gap-2 shrink-0">
          {onToggleWrite && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => onToggleWrite(!share.can_write)}
            >
              {share.can_write ? "Quitar escritura" : "Dar escritura"}
            </Button>
          )}
          {onDelete && (
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="icon-sm">
                  <Trash2 className="size-4" />
                </Button>
              }
              title="Revocar acceso"
              description={`Se revocara el acceso a ${RESOURCE_LABELS[share.resource_type] ?? share.resource_type}.`}
              onConfirm={onDelete}
              destructive
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function CompartirPage() {
  const { data: ownedData, isLoading: ownedLoading } = useOwnedShares();
  const { data: receivedData, isLoading: receivedLoading } = useReceivedShares();
  const createMutation = useCreateShare();
  const updateMutation = useUpdateShare();
  const deleteMutation = useDeleteShare();

  const [formOpen, setFormOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [resourceType, setResourceType] = useState<string>("");
  const [canWrite, setCanWrite] = useState(false);

  function resetForm() {
    setEmail("");
    setResourceType("");
    setCanWrite(false);
    setFormOpen(false);
  }

  function handleCreate() {
    if (!email.trim()) {
      toast.error("Ingresa el email del usuario");
      return;
    }
    if (!resourceType) {
      toast.error("Selecciona un recurso para compartir");
      return;
    }

    createMutation.mutate(
      {
        grantee_email: email.trim(),
        resource_type: resourceType as ShareResourceType,
        can_write: canWrite,
      },
      {
        onSuccess: () => {
          toast.success("Recurso compartido");
          resetForm();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function handleToggleWrite(id: string, canWrite: boolean) {
    updateMutation.mutate(
      { id, data: { can_write: canWrite } },
      {
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Acceso revocado"),
      onError: (err) => toast.error(err.message),
    });
  }

  const owned = ownedData?.items ?? [];
  const received = receivedData?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Compartir</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4 mr-1" />
          Compartir recurso
        </Button>
      </div>

      {formOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nuevo acceso compartido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email del usuario</Label>
                <Input
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Recurso</Label>
                <Select value={resourceType} onValueChange={(v) => setResourceType(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar">{RESOURCE_LABELS[resourceType]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant={canWrite ? "default" : "outline"}
                size="sm"
                onClick={() => setCanWrite(!canWrite)}
              >
                {canWrite ? "Lectura y escritura" : "Solo lectura"}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Compartiendo..." : "Compartir"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowUpFromLine className="size-4" />
            Compartidos por mi ({owned.length})
          </CardTitle>
        </CardHeader>
        {ownedLoading ? (
          <CardContent>
            <p className="text-sm text-muted-foreground">Cargando...</p>
          </CardContent>
        ) : owned.length === 0 ? (
          <CardContent>
            <p className="text-sm text-muted-foreground">No compartiste ningun recurso todavia.</p>
          </CardContent>
        ) : (
          <CardContent className="p-0 divide-y divide-border">
            {owned.map((share) => (
              <ShareRow
                key={share.id}
                share={share}
                onToggleWrite={(cw) => handleToggleWrite(share.id, cw)}
                onDelete={() => handleDelete(share.id)}
              />
            ))}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowDownToLine className="size-4" />
            Compartidos conmigo ({received.length})
          </CardTitle>
        </CardHeader>
        {receivedLoading ? (
          <CardContent>
            <p className="text-sm text-muted-foreground">Cargando...</p>
          </CardContent>
        ) : received.length === 0 ? (
          <CardContent>
            <p className="text-sm text-muted-foreground">Nadie compartio recursos contigo todavia.</p>
          </CardContent>
        ) : (
          <CardContent className="p-0 divide-y divide-border">
            {received.map((share) => (
              <ShareRow key={share.id} share={share} readonly />
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
