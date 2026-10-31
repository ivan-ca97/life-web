"use client";

import { Trash2, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { toast } from "sonner";
import { formatAr } from "@/lib/datetime";
import { useOwnedShares, useReceivedShares, useDeleteShare } from "@/lib/hooks/use-shares";
import { permissionLabel } from "@/lib/share-labels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Share } from "@/lib/types/share";

function ShareRow({ share, onDelete }: { share: Share; onDelete?: () => void }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">{permissionLabel(share.permission)}</Badge>
          <Badge variant="secondary" className="text-xs">
            {share.scope === "item" ? "Un elemento" : "Todo"}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {share.audience === "public" ? "Todos" : "Un usuario"}
          </Badge>
          {!share.active && (
            <Badge variant="destructive" className="text-xs">
              Sin efecto
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatAr(share.created_at, "dd/MM/yyyy")}
        </p>
      </div>
      {onDelete && (
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="icon-sm">
              <Trash2 className="size-4" />
            </Button>
          }
          title="Dejar de compartir"
          description={`Se dejara de compartir "${permissionLabel(share.permission)}".`}
          onConfirm={onDelete}
          destructive
        />
      )}
    </div>
  );
}

function ShareList({
  title,
  icon,
  shares,
  isLoading,
  empty,
  onDelete,
}: {
  title: string;
  icon: React.ReactNode;
  shares: Share[];
  isLoading: boolean;
  empty: string;
  onDelete?: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title} ({shares.length})
        </CardTitle>
      </CardHeader>
      {isLoading ? (
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </CardContent>
      ) : shares.length === 0 ? (
        <CardContent>
          <p className="text-sm text-muted-foreground">{empty}</p>
        </CardContent>
      ) : (
        <CardContent className="p-0 divide-y divide-border">
          {shares.map((share) => (
            <ShareRow
              key={share.id}
              share={share}
              onDelete={onDelete ? () => onDelete(share.id) : undefined}
            />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

export default function CompartirPage() {
  const { data: ownedData, isLoading: ownedLoading } = useOwnedShares();
  const { data: receivedData, isLoading: receivedLoading } = useReceivedShares();
  const deleteMutation = useDeleteShare();

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Se dejo de compartir"),
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Compartir</h1>
        <p className="text-sm text-muted-foreground">
          Para hacer publico un alimento, usa el globo en tu lista de alimentos.
        </p>
      </div>
      <ShareList
        title="Compartidos por mi"
        icon={<ArrowUpFromLine className="size-4" />}
        shares={ownedData?.items ?? []}
        isLoading={ownedLoading}
        empty="No compartiste nada todavia."
        onDelete={handleDelete}
      />
      <ShareList
        title="Compartidos conmigo"
        icon={<ArrowDownToLine className="size-4" />}
        shares={receivedData?.items ?? []}
        isLoading={receivedLoading}
        empty="Nadie te compartio nada todavia."
      />
    </div>
  );
}
