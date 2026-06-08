"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  eachDayOfInterval,
  getDay,
  isAfter,
  isSameDay,
  parse,
} from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  LockOpen,
  CircleAlert,
  CheckCircle2,
  Flame,
  Footprints,
  Weight,
  UtensilsCrossed,
  TrendingDown,
  TrendingUp,
  ExternalLink,
} from "lucide-react";
import { useDate } from "@/lib/date/context";
import { useDailySummaryRange, useCloseDay, useOpenDay } from "@/lib/hooks/use-daily-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DailySummary } from "@/lib/types/daily";

type DayStatus = "closed" | "incomplete" | "ok" | "future" | "no_tracking";

function hasDayData(day: DailySummary): boolean {
  return day.closed || day.meals.count > 0 || day.exercise.count > 0 || day.weight?.weight_kg != null;
}

function getDayStatus(day: DailySummary | undefined, dateStr: string, today: Date, firstDataDate: string | null): DayStatus {
  const date = parse(dateStr, "yyyy-MM-dd", new Date());
  if (isAfter(date, today) && !isSameDay(date, today)) return "future";
  if (!firstDataDate || dateStr < firstDataDate) return "no_tracking";
  if (!day) return "incomplete";
  if (day.closed) return "closed";
  if (!hasDayData(day)) return "incomplete";
  return "ok";
}

const statusConfig: Record<DayStatus, { bg: string; ring: string; dot?: string; label: string; badgeVariant: "default" | "secondary" | "outline" | "destructive" }> = {
  closed: {
    bg: "bg-emerald-500/15",
    ring: "ring-emerald-500/30",
    dot: "bg-emerald-500",
    label: "Cerrado",
    badgeVariant: "default",
  },
  incomplete: {
    bg: "bg-amber-500/15",
    ring: "ring-amber-500/30",
    dot: "bg-amber-500",
    label: "Incompleto",
    badgeVariant: "destructive",
  },
  ok: {
    bg: "",
    ring: "",
    label: "Con datos",
    badgeVariant: "secondary",
  },
  future: {
    bg: "",
    ring: "",
    label: "Futuro",
    badgeVariant: "outline",
  },
  no_tracking: {
    bg: "",
    ring: "",
    label: "Sin seguimiento",
    badgeVariant: "outline",
  },
};

const WEEKDAYS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

function DayPopoverContent({
  dateStr,
  day,
  status,
}: {
  dateStr: string;
  day: DailySummary | undefined;
  status: DayStatus;
}) {
  const { setDate } = useDate();
  const router = useRouter();
  const closeDayMutation = useCloseDay();
  const openDayMutation = useOpenDay();
  const cfg = statusConfig[status];

  function handleToggleClosure() {
    if (day?.closed) {
      openDayMutation.mutate(dateStr, {
        onSuccess: () => toast.success("Dia reabierto"),
        onError: (err) => toast.error(err.message),
      });
    } else {
      closeDayMutation.mutate(dateStr, {
        onSuccess: () => toast.success("Dia cerrado"),
        onError: (err) => toast.error(err.message),
      });
    }
  }

  function handleGoToSummary() {
    setDate(dateStr);
    router.push("/resumen");
  }

  const date = parse(dateStr, "yyyy-MM-dd", new Date());

  return (
    <>
      <PopoverHeader>
        <div className="flex items-center justify-between">
          <PopoverTitle className="capitalize">
            {format(date, "EEEE d", { locale: es })}
          </PopoverTitle>
          <Badge variant={cfg.badgeVariant} className="text-xs">
            {cfg.label}
          </Badge>
        </div>
      </PopoverHeader>

      {day ? (
        <div className="space-y-2 text-sm">
          {/* Weight */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Weight className="size-3.5 shrink-0" />
            <span>Peso:</span>
            <span className="ml-auto font-medium text-foreground">
              {day.weight?.weight_kg != null
                ? `${day.weight.weight_kg.toFixed(1)} kg`
                : "—"}
            </span>
          </div>

          {/* Meals */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <UtensilsCrossed className="size-3.5 shrink-0" />
            <span>{day.meals.count} comida{day.meals.count !== 1 ? "s" : ""}</span>
            <span className="ml-auto font-medium text-foreground">
              {day.meals.total_calories.toFixed(0)} kcal
            </span>
          </div>

          {/* Exercise */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Flame className="size-3.5 shrink-0" />
            <span>Ejercicio</span>
            <span className="ml-auto font-medium text-foreground">
              {day.exercise.total_calories_burned.toFixed(0)} kcal
            </span>
          </div>

          {/* Steps */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Footprints className="size-3.5 shrink-0" />
            <span>Pasos</span>
            <span className="ml-auto font-medium text-foreground">
              {day.exercise.total_steps.toLocaleString()}
            </span>
          </div>

          {/* Caloric balance */}
          {day.caloric_balance != null && (
            <div className="flex items-center gap-2 text-muted-foreground">
              {day.caloric_balance >= 0
                ? <TrendingUp className="size-3.5 shrink-0 text-amber-500" />
                : <TrendingDown className="size-3.5 shrink-0 text-sky-500" />}
              <span>Balance</span>
              <span className={cn(
                "ml-auto font-medium",
                day.caloric_balance >= 0 ? "text-amber-500" : "text-sky-500"
              )}>
                {day.caloric_balance >= 0 ? "+" : ""}{day.caloric_balance.toFixed(0)} kcal
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Sin datos registrados.</p>
      )}

      <div className="flex gap-2 pt-1">
        {status !== "future" && status !== "no_tracking" && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleToggleClosure}
            disabled={closeDayMutation.isPending || openDayMutation.isPending}
          >
            {day?.closed ? (
              <><LockOpen className="size-3.5 mr-1" /> Reabrir</>
            ) : (
              <><Lock className="size-3.5 mr-1" /> Cerrar</>
            )}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleGoToSummary}
        >
          <ExternalLink className="size-3.5 mr-1" />
          Ver resumen
        </Button>
      </div>
    </>
  );
}

export default function CalendarioPage() {
  const { setDate } = useDate();
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));

  const from = format(startOfMonth(viewMonth), "yyyy-MM-dd");
  const to = format(endOfMonth(viewMonth), "yyyy-MM-dd");
  const { data, isLoading } = useDailySummaryRange(from, to);

  const today = useMemo(() => new Date(), []);
  const todayStr = format(today, "yyyy-MM-dd");

  const { summaryMap, firstDataDate } = useMemo(() => {
    const map = new Map<string, DailySummary>();
    let first: string | null = null;
    if (data?.data) {
      for (const d of data.data) {
        map.set(d.date, d);
        if (hasDayData(d) && (first === null || d.date < first)) {
          first = d.date;
        }
      }
    }
    return { summaryMap: map, firstDataDate: first };
  }, [data]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = (getDay(monthStart) + 6) % 7;
    return { allDays, leadingBlanks: startDayOfWeek };
  }, [viewMonth]);

  const stats = useMemo(() => {
    let closed = 0;
    let incomplete = 0;
    let ok = 0;
    for (const day of days.allDays) {
      const dateStr = format(day, "yyyy-MM-dd");
      const status = getDayStatus(summaryMap.get(dateStr), dateStr, today, firstDataDate);
      if (status === "closed") closed++;
      else if (status === "incomplete") incomplete++;
      else if (status === "ok") ok++;
    }
    return { closed, incomplete, ok };
  }, [days.allDays, summaryMap, today]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Calendario</h1>

      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setViewMonth(subMonths(viewMonth, 1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <h2 className="text-lg font-medium capitalize">
              {format(viewMonth, "MMMM yyyy", { locale: es })}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setViewMonth(addMonths(viewMonth, 1))}>
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-md" />
              ))}
            </div>
          ) : (
            <>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: days.leadingBlanks }).map((_, i) => (
                  <div key={`blank-${i}`} />
                ))}
                {days.allDays.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const summary = summaryMap.get(dateStr);
                  const status = getDayStatus(summary, dateStr, today, firstDataDate);
                  const cfg = statusConfig[status];
                  const isToday = dateStr === todayStr;

                  return (
                    <Popover key={dateStr}>
                      <PopoverTrigger
                        render={
                          <button
                            className={cn(
                              "relative aspect-square rounded-md flex flex-col items-center justify-center text-sm transition-colors hover:bg-muted/80 cursor-pointer",
                              cfg.bg,
                              cfg.dot && "ring-1 " + cfg.ring,
                              isToday && "font-bold",
                              (status === "future" || status === "no_tracking") && "text-muted-foreground"
                            )}
                            onDoubleClick={() => {
                              setDate(dateStr);
                              toast.success(`Fecha cambiada a ${format(day, "d 'de' MMMM", { locale: es })}`);
                            }}
                          />
                        }
                      >
                        <span>{format(day, "d")}</span>
                        {cfg.dot && (
                          <span className={cn("absolute bottom-1 size-1.5 rounded-full", cfg.dot)} />
                        )}
                        {status === "closed" && (
                          <Lock className="absolute top-1 right-1 size-2.5 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </PopoverTrigger>
                      <PopoverContent className="w-64" align="center">
                        <DayPopoverContent
                          dateStr={dateStr}
                          day={summary}
                          status={status}
                        />
                      </PopoverContent>
                    </Popover>
                  );
                })}
              </div>
            </>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 pt-2 border-t text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-foreground" />
              <span>Con datos ({stats.ok})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="size-3.5 text-emerald-500" />
              <span>Cerrado ({stats.closed})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CircleAlert className="size-3.5 text-amber-500" />
              <span>Incompleto ({stats.incomplete})</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
