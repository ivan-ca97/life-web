"use client";

import { useState } from "react";
import { format, subMonths } from "date-fns";
import { Plus, Trash2, Ruler } from "lucide-react";
import { toast } from "sonner";
import { useDate } from "@/lib/date/context";
import { useBodyMeasurements, useUpsertBodyMeasurement, useDeleteBodyMeasurement } from "@/lib/hooks/use-body-measurements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { ListSkeleton } from "@/components/loading-skeleton";
import { DatePicker } from "@/components/date-picker";

const MEASUREMENT_TYPES = [
  { value: "chest", label: "Pecho", unit: "cm" },
  { value: "waist", label: "Cintura", unit: "cm" },
  { value: "hips", label: "Cadera", unit: "cm" },
  { value: "bicep_left", label: "Bicep izq", unit: "cm" },
  { value: "bicep_right", label: "Bicep der", unit: "cm" },
  { value: "thigh_left", label: "Muslo izq", unit: "cm" },
  { value: "thigh_right", label: "Muslo der", unit: "cm" },
  { value: "calf_left", label: "Pantorrilla izq", unit: "cm" },
  { value: "calf_right", label: "Pantorrilla der", unit: "cm" },
  { value: "neck", label: "Cuello", unit: "cm" },
  { value: "forearm", label: "Antebrazo", unit: "cm" },
  { value: "shoulders", label: "Hombros", unit: "cm" },
] as const;

const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  MEASUREMENT_TYPES.map((t) => [t.value, t.label]),
);

const TYPE_UNITS: Record<string, string> = Object.fromEntries(
  MEASUREMENT_TYPES.map((t) => [t.value, t.unit]),
);

export default function MedidasPage() {
  const { date } = useDate();
  const today = format(new Date(), "yyyy-MM-dd");
  const [from, setFrom] = useState(format(subMonths(new Date(), 3), "yyyy-MM-dd"));
  const [to, setTo] = useState(today);
  const [filterType, setFilterType] = useState<string>("");

  const { data, isLoading } = useBodyMeasurements({
    from,
    to,
    type: filterType || undefined,
  });

  const upsertMutation = useUpsertBodyMeasurement();
  const deleteMutation = useDeleteBodyMeasurement();

  const [formOpen, setFormOpen] = useState(false);
  const [formDate, setFormDate] = useState(date);
  const [formType, setFormType] = useState("");
  const [formValue, setFormValue] = useState("");
  const [formNotes, setFormNotes] = useState("");

  function resetForm() {
    setFormDate(date);
    setFormType("");
    setFormValue("");
    setFormNotes("");
    setFormOpen(false);
  }

  function handleSave() {
    const v = Number(formValue);
    if (!formType) {
      toast.error("Selecciona un tipo de medida");
      return;
    }
    if (!formValue || isNaN(v) || v <= 0) {
      toast.error("El valor debe ser mayor a 0");
      return;
    }

    upsertMutation.mutate(
      { date: formDate, type: formType, data: { value: v, notes: formNotes || undefined } },
      {
        onSuccess: () => {
          toast.success("Medida guardada");
          resetForm();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function handleDelete(measurementDate: string, type: string) {
    deleteMutation.mutate(
      { date: measurementDate, type },
      {
        onSuccess: () => toast.success("Medida eliminada"),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  const items = data?.items ?? [];

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    (acc[item.date] ??= []).push(item);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Medidas corporales</h1>
        <Button onClick={() => { setFormDate(date); setFormOpen(true); }}>
          <Plus className="size-4 mr-1" />
          Nueva
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <DatePicker value={from} onChange={setFrom} />
        <span className="text-muted-foreground text-sm">a</span>
        <DatePicker value={to} onChange={setTo} />
        <Select value={filterType} onValueChange={(v) => setFilterType(v ?? "")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Todas">{TYPE_LABELS[filterType] ?? "Todas"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {MEASUREMENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nueva medida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar">{TYPE_LABELS[formType]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {MEASUREMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor ({formType ? TYPE_UNITS[formType] : "cm"})</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  placeholder="0.0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Input
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Ej: despues del entrenamiento"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <ListSkeleton count={5} />
      ) : items.length === 0 ? (
        <EmptyState
          message="No hay medidas registradas"
          action={{ label: "Registrar medida", onClick: () => setFormOpen(true) }}
        />
      ) : (
        <div className="space-y-4">
          {sortedDates.map((d) => (
            <Card key={d}>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">{d}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border">
                {grouped[d].map((m) => (
                  <div key={`${m.date}-${m.type}`} className="flex items-center gap-4 px-4 py-3">
                    <Ruler className="size-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">
                          {TYPE_LABELS[m.type] ?? m.type}
                        </span>
                        <span className="font-medium tabular-nums">
                          {m.value} {TYPE_UNITS[m.type] ?? "cm"}
                        </span>
                      </div>
                      {m.notes && (
                        <p className="text-xs text-muted-foreground">{m.notes}</p>
                      )}
                    </div>
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <Trash2 className="size-4" />
                        </Button>
                      }
                      title="Eliminar medida"
                      description={`Se eliminara la medida de ${TYPE_LABELS[m.type] ?? m.type} del ${m.date}.`}
                      onConfirm={() => handleDelete(m.date, m.type)}
                      destructive
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
