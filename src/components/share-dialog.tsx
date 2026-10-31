"use client";

import { useState } from "react";
import { Search, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { createShare } from "@/lib/api/shares";
import { findDiscoverableUser } from "@/lib/api/users";
import { useShareablePermissions } from "@/lib/hooks/use-permissions";
import { useDeleteShare, useOwnedShares } from "@/lib/hooks/use-shares";
import { permissionLabel } from "@/lib/share-labels";
import type { PermissionDefinition } from "@/lib/types/permission";
import type { PublicUser } from "@/lib/types/user";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Share one item instead of everything the permissions apply to. */
  item?: { id: string; name: string };
  /** Which of the permissions the user can share are offered here. */
  permissionFilter?: (permission: PermissionDefinition) => boolean;
}

export function ShareDialog({
  open,
  onOpenChange,
  title,
  description,
  item,
  permissionFilter,
}: ShareDialogProps) {
  const queryClient = useQueryClient();
  const { data: permissionsData } = useShareablePermissions();
  const { data: sharesData } = useOwnedShares();
  const deleteShareMutation = useDeleteShare();

  const [username, setUsername] = useState("");
  const [grantee, setGrantee] = useState<PublicUser | null>(null);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const offered = (permissionsData?.items ?? []).filter(
    (p) => (item ? p.item_shareable : true) && (permissionFilter ? permissionFilter(p) : true),
  );
  const offeredNames = new Set(offered.map((p) => p.permission));
  const existing = (sharesData?.items ?? []).filter(
    (s) =>
      s.audience === "user" &&
      offeredNames.has(s.permission) &&
      (item ? s.scope === "item" && s.resource_id === item.id : s.scope === "collection"),
  );

  async function handleSearch() {
    const name = username.trim();
    if (!name) return;
    setSearching(true);
    setGrantee(null);
    try {
      const found = await findDiscoverableUser(name);
      setGrantee(found);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        toast.error("No hay ningun usuario visible con ese nombre");
      } else {
        toast.error((err as Error).message);
      }
    } finally {
      setSearching(false);
    }
  }

  function toggle(permission: string) {
    const next = new Set(selected);
    if (next.has(permission)) {
      next.delete(permission);
    } else {
      next.add(permission);
    }
    setSelected(next);
  }

  async function handleShare() {
    if (!grantee || selected.size === 0) return;
    setSaving(true);
    let shared = 0;
    for (const permission of selected) {
      try {
        await createShare({
          permission,
          scope: item ? "item" : "collection",
          resource_id: item?.id,
          audience: "user",
          grantee_id: grantee.id,
        });
        shared++;
      } catch (err) {
        toast.error(`${permissionLabel(permission)}: ${(err as Error).message}`);
      }
    }
    setSaving(false);
    queryClient.invalidateQueries({ queryKey: ["shares"] });
    if (shared > 0) {
      toast.success(`Compartido con @${grantee.username ?? "usuario"}`);
      setSelected(new Set());
      setGrantee(null);
      setUsername("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="share-username">Usuario</Label>
            <div className="flex gap-2">
              <Input
                id="share-username"
                placeholder="nombre de usuario"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setGrantee(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
              <Button variant="outline" onClick={handleSearch} disabled={searching || !username.trim()}>
                <Search className="size-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Solo aparecen quienes activaron &quot;Que me encuentren&quot; en su perfil.
            </p>
            {grantee && (
              <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                {grantee.photo_url ? (
                  <img src={grantee.photo_url} alt="" className="size-6 rounded-full object-cover" />
                ) : (
                  <UserRound className="size-5 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">@{grantee.username}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Que puede hacer</Label>
            {offered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay nada que puedas compartir aca.</p>
            ) : (
              <div className="space-y-1">
                {offered.map((p) => (
                  <label key={p.permission} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={selected.has(p.permission)}
                      onChange={() => toggle(p.permission)}
                    />
                    {permissionLabel(p.permission)}
                  </label>
                ))}
              </div>
            )}
          </div>

          <Button
            className="w-full"
            onClick={handleShare}
            disabled={!grantee || selected.size === 0 || saving}
          >
            {saving ? "Compartiendo..." : "Compartir"}
          </Button>

          {existing.length > 0 && (
            <div className="space-y-2">
              <Label>Ya compartido</Label>
              <div className="divide-y divide-border rounded-md border">
                {existing.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <span className="flex-1">
                      {permissionLabel(s.permission)}
                      <span className="text-muted-foreground"> · usuario {s.grantee_id?.slice(0, 8)}</span>
                      {!s.active && <span className="text-destructive"> · sin efecto</span>}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        deleteShareMutation.mutate(s.id, {
                          onError: (err) => toast.error(err.message),
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
