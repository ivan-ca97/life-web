"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, ArrowDownToLine, ArrowUpFromLine, Share2, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";
import { formatAr } from "@/lib/datetime";
import { useOwnedShares, useReceivedShares, useDeleteShare } from "@/lib/hooks/use-shares";
import { permissionLabel } from "@/lib/share-labels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ShareDialog } from "@/components/share-dialog";
import { FoodDetailDialog } from "@/components/food-detail-dialog";
import { FoodFormSheet } from "@/components/food-form-sheet";
import type { Share } from "@/lib/types/share";

function who(share: Share, received: boolean): string {
  if (received) {
    return share.owner_username ? `de @${share.owner_username}` : "de un usuario sin nombre";
  }
  if (share.audience === "public") {
    return "con todos";
  }
  return share.grantee_username ? `con @${share.grantee_username}` : "con un usuario sin nombre";
}

/** A food shared on its own that the user received, to view or edit. */
interface SharedFood {
  foodId: string;
  ownerId: string;
}

function ShareRow({
  share,
  received,
  onDelete,
  onOpenFood,
}: {
  share: Share;
  received: boolean;
  onDelete?: () => void;
  onOpenFood?: (food: SharedFood, edit: boolean) => void;
}) {
  const sharedFood =
    received && share.active && share.scope === "item" && share.resource_id && share.permission.startsWith("foods:")
      ? { foodId: share.resource_id, ownerId: share.owner_id }
      : null;
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">{permissionLabel(share.permission)}</Badge>
          <Badge variant="secondary" className="text-xs">
            {share.scope === "item" ? "Un elemento" : "Todo"}
          </Badge>
          <span className="text-sm">{who(share, received)}</span>
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
      {sharedFood && onOpenFood && share.permission === "foods:read" && (
        <Button variant="ghost" size="sm" onClick={() => onOpenFood(sharedFood, false)}>
          <Eye className="size-4 mr-1" />
          Ver
        </Button>
      )}
      {sharedFood && onOpenFood && share.permission === "foods:update" && (
        <Button variant="ghost" size="sm" onClick={() => onOpenFood(sharedFood, true)}>
          <Pencil className="size-4 mr-1" />
          Editar
        </Button>
      )}
      {received && share.active && share.scope === "collection" && (
        <Button variant="ghost" size="sm" render={<Link href={`/compartido/${share.owner_id}`} />}>
          <Eye className="size-4 mr-1" />
          Ver
        </Button>
      )}
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
  received,
  onDelete,
  onOpenFood,
}: {
  title: string;
  icon: React.ReactNode;
  shares: Share[];
  isLoading: boolean;
  empty: string;
  received: boolean;
  onDelete?: (id: string) => void;
  onOpenFood?: (food: SharedFood, edit: boolean) => void;
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
              received={received}
              onDelete={onDelete ? () => onDelete(share.id) : undefined}
              onOpenFood={onOpenFood}
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
  const [sharing, setSharing] = useState(false);
  const [viewingFood, setViewingFood] = useState<SharedFood | null>(null);
  const [editingFood, setEditingFood] = useState<SharedFood | null>(null);

  function openFood(food: SharedFood, edit: boolean) {
    if (edit) {
      setEditingFood(food);
    } else {
      setViewingFood(food);
    }
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Se dejo de compartir"),
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Compartir</h1>
          <p className="text-sm text-muted-foreground">
            Para hacer publico un alimento, usa el globo en tu lista de alimentos.
          </p>
        </div>
        <Button onClick={() => setSharing(true)}>
          <Share2 className="size-4 mr-1" />
          Compartir
        </Button>
      </div>
      <ShareDialog
        open={sharing}
        onOpenChange={setSharing}
        title="Compartir con un usuario"
        description="Elegi que va a poder hacer con tus datos."
      />
      <ShareList
        title="Compartidos por mi"
        icon={<ArrowUpFromLine className="size-4" />}
        shares={ownedData?.items ?? []}
        isLoading={ownedLoading}
        empty="No compartiste nada todavia."
        received={false}
        onDelete={handleDelete}
      />
      <ShareList
        title="Compartidos conmigo"
        icon={<ArrowDownToLine className="size-4" />}
        shares={receivedData?.items ?? []}
        isLoading={receivedLoading}
        empty="Nadie te compartio nada todavia."
        received
        onOpenFood={openFood}
      />
      {viewingFood && (
        <FoodDetailDialog
          open={!!viewingFood}
          onOpenChange={(open) => {
            if (!open) setViewingFood(null);
          }}
          foodId={viewingFood.foodId}
          ownerId={viewingFood.ownerId}
        />
      )}
      {editingFood && (
        <FoodFormSheet
          open={!!editingFood}
          onOpenChange={(open) => {
            if (!open) setEditingFood(null);
          }}
          foodId={editingFood.foodId}
          ownerId={editingFood.ownerId}
        />
      )}
    </div>
  );
}
