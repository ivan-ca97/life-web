"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useUsers, useDeleteUser } from "@/lib/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PaginationControls } from "@/components/pagination-controls";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { ListSkeleton } from "@/components/loading-skeleton";
import { UserFormSheet } from "@/components/user-form-sheet";

export default function UsuariosPage() {
  const [offset, setOffset] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const limit = 20;

  const { data, isLoading } = useUsers({ limit, offset });
  const deleteMutation = useDeleteUser();

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Usuario eliminado"),
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus className="size-4 mr-1" />
          Nuevo
        </Button>
      </div>

      {isLoading ? (
        <ListSkeleton count={3} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          message="No hay usuarios registrados"
          action={{ label: "Crear usuario", onClick: () => setSheetOpen(true) }}
        />
      ) : (
        <>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {data.items.map((user) => (
                <div key={user.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">{user.email}</span>
                    <p className="text-sm text-muted-foreground">
                      Creado {format(new Date(user.created_at), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="icon-sm">
                        <Trash2 className="size-4" />
                      </Button>
                    }
                    title="Eliminar usuario"
                    description={`Se eliminara "${user.email}" permanentemente.`}
                    onConfirm={() => handleDelete(user.id)}
                    destructive
                  />
                </div>
              ))}
            </CardContent>
          </Card>
          <PaginationControls
            total={data.total}
            limit={data.limit}
            offset={offset}
            onPageChange={setOffset}
          />
        </>
      )}
      <UserFormSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
