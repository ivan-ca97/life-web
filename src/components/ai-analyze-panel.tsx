"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles, Loader2, Plus, Trash2, Info, Wand2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { useEstimateMeal } from "@/lib/hooks/use-ai";
import { useCreateFood } from "@/lib/hooks/use-foods";
import { getFood, updateFood } from "@/lib/api/foods";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { fmtCal, fmtGrams } from "@/lib/format";
import type { Food } from "@/lib/types/food";
import type {
  AiConfidence,
  AiEstimateCorrection,
  AiNewFoodSuggestion,
  AiSuggestedCorrection,
  EstimateMealResponse,
} from "@/lib/types/ai";

export interface AiAppliedItem {
  food: Food;
  quantity: number;
  unit: string;
  measurement_method: string;
}

const CONFIDENCE_STYLE: Record<AiConfidence, string> = {
  high: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};
const CONFIDENCE_LABEL: Record<AiConfidence, string> = { high: "Alta", medium: "Media", low: "Baja" };

interface EditableItem {
  food_id: string;
  food_name: string;
  quantity: string;
  unit: string;
  confidence: AiConfidence;
  assumption: string;
  sanity_warnings: string[];
  suggested_correction?: AiSuggestedCorrection;
  include: boolean;
}

function ConfidenceBadge({ c }: { c: AiConfidence }) {
  return <Badge variant="secondary" className={`text-xs ${CONFIDENCE_STYLE[c]}`}>{CONFIDENCE_LABEL[c]}</Badge>;
}

export function AiAnalyzePanel({
  photoUrls,
  onApply,
  onClose,
}: {
  photoUrls: string[];
  onApply: (items: AiAppliedItem[]) => void;
  onClose: () => void;
}) {
  const estimate = useEstimateMeal();
  const createFood = useCreateFood();
  const qc = useQueryClient();

  const [correctingId, setCorrectingId] = useState<string | null>(null);
  const [correctedIds, setCorrectedIds] = useState<string[]>([]);
  const [instructions, setInstructions] = useState("");
  const [assumeOnlyVisible, setAssumeOnlyVisible] = useState(true);

  const [result, setResult] = useState<EstimateMealResponse | null>(null);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [suggestions, setSuggestions] = useState<AiNewFoodSuggestion[]>([]);
  const [corrections, setCorrections] = useState<AiEstimateCorrection[]>([]);
  const [corrItem, setCorrItem] = useState("");
  const [corrText, setCorrText] = useState("");
  const [applying, setApplying] = useState(false);

  const hadPhotos = photoUrls.length > 0;

  function applyResult(res: EstimateMealResponse) {
    setResult(res);
    setItems(
      res.matched_items.map((m) => ({
        food_id: m.food_id,
        food_name: m.food_name,
        quantity: String(m.estimated_quantity),
        unit: m.unit,
        confidence: m.confidence,
        assumption: m.assumption,
        sanity_warnings: m.sanity_warnings ?? [],
        suggested_correction: m.suggested_correction,
        include: true,
      }))
    );
    setSuggestions(res.new_food_suggestions ?? []);
  }

  function estimateError(err: unknown): string {
    if (err instanceof ApiError) {
      if (err.status === 429) return "Alcanzaste tu limite mensual de IA.";
      if (err.status === 404) return "La estimacion por IA no esta disponible en el servidor.";
      if (err.status === 500) return "Fallo el proveedor de IA. Intenta mas tarde.";
      return err.message;
    }
    return "No se pudo analizar la comida.";
  }

  function runEstimate(withCorrections: AiEstimateCorrection[]) {
    if (!hadPhotos && !instructions.trim()) {
      toast.error("Subi al menos una foto o agrega instrucciones.");
      return;
    }
    estimate.mutate(
      {
        photo_urls: photoUrls,
        instructions: instructions.trim() || undefined,
        assume_only_visible: assumeOnlyVisible,
        corrections: withCorrections.length > 0 ? withCorrections : undefined,
      },
      {
        onSuccess: (res) => applyResult(res),
        onError: (err) => toast.error(estimateError(err)),
      }
    );
  }

  function addCorrection() {
    if (!corrText.trim()) return;
    setCorrections((prev) => [...prev, { item: corrItem.trim(), correction: corrText.trim() }]);
    setCorrItem("");
    setCorrText("");
  }

  function updateItem(idx: number, patch: Partial<EditableItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  async function applyCorrection(foodId: string, c: AiSuggestedCorrection) {
    setCorrectingId(foodId);
    try {
      await updateFood(foodId, {
        default_calories: c.calories,
        default_protein_grams: c.protein_grams,
        default_carbs_grams: c.carbs_grams,
        default_fat_grams: c.fat_grams,
        default_fiber_grams: c.fiber_grams,
      });
      qc.invalidateQueries({ queryKey: ["foods"] });
      setCorrectedIds((prev) => [...prev, foodId]);
      toast.success("Macros del alimento actualizados");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar el alimento");
    } finally {
      setCorrectingId(null);
    }
  }

  async function addSuggestion(sug: AiNewFoodSuggestion, idx: number) {
    try {
      const food = await createFood.mutateAsync({
        name: sug.name,
        measurement_type: sug.create_params.measurement_type,
        base_unit: sug.create_params.base_unit,
        base_quantity: sug.create_params.base_quantity,
        default_calories: sug.create_params.default_calories ?? undefined,
        default_protein_grams: sug.create_params.default_protein_grams ?? undefined,
        default_carbs_grams: sug.create_params.default_carbs_grams ?? undefined,
        default_fat_grams: sug.create_params.default_fat_grams ?? undefined,
        default_fiber_grams: sug.create_params.default_fiber_grams ?? undefined,
      });
      setItems((prev) => [
        ...prev,
        {
          food_id: food.id,
          food_name: food.name,
          quantity: String(sug.estimated_quantity),
          unit: sug.unit,
          confidence: sug.confidence,
          assumption: sug.assumption,
          sanity_warnings: [],
          include: true,
        },
      ]);
      setSuggestions((prev) => prev.filter((_, i) => i !== idx));
      toast.success(`"${food.name}" agregado a tu base`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear el alimento");
    }
  }

  async function handleApply() {
    const chosen = items.filter((it) => it.include);
    if (chosen.length === 0) {
      toast.error("Incluí al menos un alimento.");
      return;
    }
    for (const it of chosen) {
      const q = Number(it.quantity);
      if (isNaN(q) || q <= 0) {
        toast.error(`Revisa la cantidad de "${it.food_name}".`);
        return;
      }
    }
    setApplying(true);
    try {
      const method = hadPhotos ? "photo_estimate" : "visual_estimate";
      const applied: AiAppliedItem[] = await Promise.all(
        chosen.map(async (it) => ({
          food: await getFood(it.food_id),
          quantity: Number(it.quantity),
          unit: it.unit,
          measurement_method: method,
        }))
      );
      onApply(applied);
      toast.success(`${applied.length} alimento${applied.length === 1 ? "" : "s"} agregado${applied.length === 1 ? "" : "s"}`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron agregar los alimentos");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4" /> Analizar con IA
        </h4>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        {hadPhotos
          ? `La IA analiza ${photoUrls.length} foto${photoUrls.length === 1 ? "" : "s"} y agrega los alimentos a la comida.`
          : "Describi la comida y la IA sugiere los alimentos."}
      </p>

      {!result ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ai-instructions">Instrucciones (opcional)</Label>
            <Textarea
              id="ai-instructions"
              placeholder="Ej: el arroz es integral, ~200g; sin aceite"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={assumeOnlyVisible}
              onChange={(e) => setAssumeOnlyVisible(e.target.checked)}
            />
            Asumir solo lo que se ve en la foto
          </label>

          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5 mt-0.5 shrink-0" />
            Las fotos se envian a OpenAI para el analisis. La estimacion por foto es
            orientativa (~35-40% de error).
          </p>

          <Button type="button" className="w-full" onClick={() => runEstimate([])} disabled={estimate.isPending}>
            {estimate.isPending ? (
              <><Loader2 className="size-4 mr-1 animate-spin" /> Analizando...</>
            ) : (
              <><Sparkles className="size-4 mr-1" /> Analizar</>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {result.no_food_detected && (
            <Card className="border-rose-500/40 bg-rose-500/5">
              <CardContent className="p-3 text-sm">
                <span className="font-medium">No se detecto comida en las fotos.</span>{" "}
                Revisa que muestren comida o bebida; podes describirla por texto y volver a analizar.
              </CardContent>
            </Card>
          )}
          {result.needs_clarification && result.clarification_question && (
            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardContent className="p-3 text-sm">
                <span className="font-medium">La IA necesita una aclaracion: </span>
                {result.clarification_question}
              </CardContent>
            </Card>
          )}

          {items.length > 0 && (
            <div className="space-y-2">
              <Label>Alimentos detectados</Label>
              {items.map((it, idx) => (
                <Card key={`${it.food_id}-${idx}`} className={it.include ? "" : "opacity-50"}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="size-4 accent-primary mt-1"
                        checked={it.include}
                        onChange={(e) => updateItem(idx, { include: e.target.checked })}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{it.food_name}</span>
                          <ConfidenceBadge c={it.confidence} />
                        </div>
                        {it.assumption && <p className="text-xs text-muted-foreground mt-0.5">{it.assumption}</p>}
                        {it.sanity_warnings.map((w, i) => (
                          <p key={i} className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">⚠ {w}</p>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          className="w-20 h-8"
                          value={it.quantity}
                          onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                        />
                        <span className="text-sm text-muted-foreground w-8">{it.unit}</span>
                      </div>
                    </div>
                    {it.suggested_correction &&
                      (correctedIds.includes(it.food_id) ? (
                        <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <Check className="size-3.5" /> Alimento actualizado
                        </p>
                      ) : (
                        <div className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2 space-y-1.5">
                          <p className="text-xs text-muted-foreground">{it.suggested_correction.reason}</p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => applyCorrection(it.food_id, it.suggested_correction!)}
                            disabled={correctingId === it.food_id}
                          >
                            {correctingId === it.food_id ? (
                              <Loader2 className="size-3.5 mr-1 animate-spin" />
                            ) : (
                              <Wand2 className="size-3.5 mr-1" />
                            )}
                            Actualizar alimento a {fmtCal(it.suggested_correction.calories ?? 0)} kcal /{" "}
                            {fmtGrams(it.suggested_correction.protein_grams ?? 0)}g P
                          </Button>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="space-y-2">
              <Label>Sugerencias (no estaban en tu base)</Label>
              {suggestions.map((sug, idx) => (
                <Card key={idx} className="border-dashed">
                  <CardContent className="p-3 flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{sug.name}</span>
                        <ConfidenceBadge c={sug.confidence} />
                        <span className="text-xs text-muted-foreground">{sug.estimated_quantity}{sug.unit}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {fmtCal(sug.create_params.default_calories ?? 0)} kcal /{" "}
                        {sug.create_params.base_quantity}{sug.create_params.base_unit}
                        {sug.assumption ? ` · ${sug.assumption}` : ""}
                      </p>
                    </div>
                    <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => addSuggestion(sug, idx)} disabled={createFood.isPending}>
                      <Plus className="size-3.5 mr-1" /> Crear
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {result.assumptions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {result.assumptions.map((a, i) => (
                <Badge key={i} variant="outline" className="text-xs font-normal">{a}</Badge>
              ))}
            </div>
          )}

          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <div className="font-medium">{fmtCal(result.totals.calories)} kcal</div>
            <div className="text-xs text-muted-foreground tabular-nums">
              P {fmtGrams(result.totals.protein_grams)} · C {fmtGrams(result.totals.carbs_grams)} ·{" "}
              G {fmtGrams(result.totals.fat_grams)} · F {fmtGrams(result.totals.fiber_grams)}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Corregir un supuesto y re-analizar</Label>
            {corrections.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="flex-1">{c.item ? `${c.item}: ` : ""}{c.correction}</span>
                <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => setCorrections((prev) => prev.filter((_, j) => j !== i))}>
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input placeholder="Alimento (opc.)" className="w-32 h-8" value={corrItem} onChange={(e) => setCorrItem(e.target.value)} />
              <Input placeholder="Correccion" className="flex-1 h-8" value={corrText} onChange={(e) => setCorrText(e.target.value)} />
              <Button type="button" size="sm" variant="ghost" onClick={addCorrection}>Agregar</Button>
            </div>
            {corrections.length > 0 && (
              <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => runEstimate(corrections)} disabled={estimate.isPending}>
                {estimate.isPending ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Sparkles className="size-4 mr-1" />}
                Re-analizar con correcciones
              </Button>
            )}
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setResult(null)}>Volver</Button>
            <Button type="button" className="flex-1" onClick={handleApply} disabled={applying}>
              {applying ? <Loader2 className="size-4 mr-1 animate-spin" /> : null}
              Agregar a la comida
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
