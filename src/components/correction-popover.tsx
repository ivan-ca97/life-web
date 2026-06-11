"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUpsertCorrection } from "@/lib/hooks/use-daily-summary";
import { fmtDuration } from "@/lib/format";
import type { CorrectionField, DailyCorrection } from "@/lib/types/daily";

interface CorrectionPopoverProps {
  date: string;
  field: CorrectionField;
  label: string;
  unit: string;
  baseValue: number;
  correction?: DailyCorrection;
  durationMode?: boolean;
}

export function CorrectionPopover({
  date,
  field,
  label,
  unit,
  baseValue,
  correction,
  durationMode,
}: CorrectionPopoverProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [durationH, setDurationH] = useState("");
  const [durationM, setDurationM] = useState("");
  const [durationS, setDurationS] = useState("");
  const [notes, setNotes] = useState("");

  const upsertMutation = useUpsertCorrection();

  const correctionValue = correction?.[field] ?? 0;
  const currentTotal = baseValue + (correctionValue as number);
  const hasCorrectionForField = correction?.[field] != null;

  const currentH = Math.floor(currentTotal / 3600);
  const currentM = Math.floor((currentTotal % 3600) / 60);
  const currentS = Math.round(currentTotal % 60);

  function getDesiredValue(): number | null {
    if (durationMode) {
      const h = Number(durationH) || 0;
      const m = Number(durationM) || 0;
      const s = Number(durationS) || 0;
      return h * 3600 + m * 60 + s;
    }
    const n = Number(value);
    return isNaN(n) ? null : n;
  }

  const hasDurationInput = durationH !== "" || durationM !== "" || durationS !== "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const desired = getDesiredValue();
    if (desired == null) return;
    const delta = desired - baseValue;

    upsertMutation.mutate(
      {
        date,
        ...correction,
        [field]: delta === 0 ? undefined : delta,
        notes: notes || correction?.notes || "",
      },
      {
        onSuccess: () => {
          toast.success("Correccion guardada");
          setValue("");
          setDurationH("");
          setDurationM("");
          setDurationS("");
          setNotes("");
          setOpen(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  function handleDelete() {
    upsertMutation.mutate(
      {
        date,
        ...correction,
        [field]: undefined,
        notes: correction?.notes || "",
      },
      {
        onSuccess: () => {
          toast.success("Correccion eliminada");
          setOpen(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  }

  const isSubmitDisabled = durationMode
    ? upsertMutation.isPending || !hasDurationInput
    : upsertMutation.isPending || !value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            className={hasCorrectionForField ? "text-primary" : "text-muted-foreground opacity-40 hover:opacity-100"}
          />
        }
      >
        <Pencil className="size-3" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <PopoverHeader>
          <PopoverTitle>Corregir {label.toLowerCase()}</PopoverTitle>
        </PopoverHeader>

        {hasCorrectionForField && (
          <div className="flex items-center justify-between rounded-md bg-muted px-2 py-1.5 text-xs">
            <span>
              Corregido a{" "}
              {durationMode
                ? fmtDuration(currentTotal)
                : `${baseValue + (correctionValue as number)} ${unit}`}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleDelete}
              disabled={upsertMutation.isPending}
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2">
          {durationMode ? (
            <div className="space-y-1">
              <Label className="text-xs">Duracion total</Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="relative">
                  <Input
                    className="pr-7 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    type="number"
                    min="0"
                    placeholder={String(currentH)}
                    value={durationH}
                    onChange={(e) => setDurationH(e.target.value)}
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">h</span>
                </div>
                <div className="relative">
                  <Input
                    className="pr-7 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    type="number"
                    min="0"
                    max={durationH ? 59 : undefined}
                    placeholder={String(currentM)}
                    value={durationM}
                    onChange={(e) => setDurationM(e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">m</span>
                </div>
                <div className="relative">
                  <Input
                    className="pr-7 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    type="number"
                    min="0"
                    max={durationM ? 59 : undefined}
                    placeholder={String(currentS)}
                    value={durationS}
                    onChange={(e) => setDurationS(e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">s</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="text-xs">Valor total ({unit})</Label>
              <Input
                type="number"
                step="any"
                placeholder={String(currentTotal)}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
              />
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Nota (opcional)</Label>
            <Input
              placeholder="Razon del ajuste"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            size="sm"
            className="w-full"
            disabled={isSubmitDisabled}
          >
            {upsertMutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
