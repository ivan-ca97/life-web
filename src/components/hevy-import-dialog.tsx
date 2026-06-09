"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useImportHevyCsv } from "@/lib/hooks/use-exercises";
import type { ImportResponse } from "@/lib/types/exercise";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function statusVariant(
  status: string
): "default" | "secondary" | "destructive" {
  if (status === "created") return "default";
  if (status === "skipped") return "secondary";
  return "destructive";
}

function statusLabel(status: string): string {
  if (status === "created") return "Creado";
  if (status === "skipped") return "Omitido";
  if (status === "blocked") return "Bloqueado";
  return status;
}

interface HevyImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HevyImportDialog({
  open,
  onOpenChange,
}: HevyImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<ImportResponse | null>(null);
  const mutation = useImportHevyCsv();

  function handleSubmit() {
    if (!file) return;
    mutation.mutate(file, {
      onSuccess: (data) => setResults(data),
      onError: (err) => toast.error(err.message),
    });
  }

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => {
      setFile(null);
      setResults(null);
      mutation.reset();
    }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar desde Hevy</DialogTitle>
          <DialogDescription>
            Sube el archivo CSV exportado desde Hevy.
          </DialogDescription>
        </DialogHeader>

        {results ? (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Badge>{results.created} creados</Badge>
              <Badge variant="secondary">{results.skipped} omitidos</Badge>
              {results.blocked > 0 && (
                <Badge variant="destructive">
                  {results.blocked} bloqueados
                </Badge>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1.5">
              {results.results.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground ml-2">
                      {item.date}
                    </span>
                  </div>
                  <Badge
                    variant={statusVariant(item.status)}
                    className="shrink-0"
                  >
                    {statusLabel(item.status)}
                  </Badge>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Cerrar</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button
              onClick={handleSubmit}
              disabled={!file || mutation.isPending}
              className="w-full"
            >
              {mutation.isPending ? "Importando..." : "Importar"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
