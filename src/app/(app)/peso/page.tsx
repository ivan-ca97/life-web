"use client";

import { useState } from "react";
import { format, subMonths } from "date-fns";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWeightEntries, useDeleteWeightEntry } from "@/lib/hooks/use-weight";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PaginationControls } from "@/components/pagination-controls";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { ListSkeleton } from "@/components/loading-skeleton";
import { WeightFormSheet } from "@/components/weight-form-sheet";
import { DatePicker } from "@/components/date-picker";

export default function PesoPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [from, setFrom] = useState(format(subMonths(new Date(), 3), "yyyy-MM-dd"));
  const [to, setTo] = useState(today);
  const [offset, setOffset] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const limit = 20;

  const { data, isLoading } = useWeightEntries({ from, to, limit, offset });
  const deleteMutation = useDeleteWeightEntry();

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Registro eliminado"),
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Peso</h1>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus className="size-4 mr-1" />
          Nuevo
        </Button>
      </div>

      <div className="flex gap-2 items-center">
        <DatePicker value={from} onChange={(d) => { setFrom(d); setOffset(0); }} />
        <span className="text-muted-foreground text-sm">a</span>
        <DatePicker value={to} onChange={(d) => { setTo(d); setOffset(0); }} />
      </div>

      {isLoading ? (
        <ListSkeleton count={5} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          message="No hay registros de peso"
          action={{ label: "Registrar peso", onClick: () => setSheetOpen(true) }}
        />
      ) : (
        <>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {data.items.map((entry) => (
                <div key={entry.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium tabular-nums">
                        {entry.weight_kg} kg
                      </span>
                      {entry.body_fat_percentage != null && (
                        <span className="text-sm text-muted-foreground">
                          {entry.body_fat_percentage}% grasa
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {entry.date}
                      {entry.notes && ` — ${entry.notes}`}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setEditingId(entry.id);
                        setSheetOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <Trash2 className="size-4" />
                        </Button>
                      }
                      title="Eliminar registro"
                      description="Se eliminara este registro de peso permanentemente."
                      onConfirm={() => handleDelete(entry.id)}
                      destructive
                    />
                  </div>
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
      <WeightFormSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingId(undefined);
        }}
        entryId={editingId}
      />
    </div>
  );
}
