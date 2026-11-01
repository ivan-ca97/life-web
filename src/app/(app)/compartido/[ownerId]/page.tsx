"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useReceivedShares } from "@/lib/hooks/use-shares";
import {
  getOwnerExercises,
  getOwnerFoods,
  getOwnerGoals,
  getOwnerMeals,
  getOwnerWeight,
} from "@/lib/api/shared";
import { formatAr } from "@/lib/datetime";
import { fmtCal, fmtDuration, fmtGrams } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return isoDate(date);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">{children}</CardContent>
    </Card>
  );
}

function Empty({ loading }: { loading: boolean }) {
  return <p className="text-muted-foreground">{loading ? "Cargando..." : "Nada para mostrar."}</p>;
}

export default function SharedDataPage() {
  const { ownerId } = useParams<{ ownerId: string }>();
  const { data: receivedData, isLoading } = useReceivedShares();

  // What this owner shared with me over all of their data, and still grants.
  const fromOwner = (receivedData?.items ?? []).filter(
    (s) => s.owner_id === ownerId && s.active && s.scope === "collection",
  );
  const granted = new Set(fromOwner.map((s) => s.permission));
  const ownerName = fromOwner.find((s) => s.owner_username)?.owner_username;
  const today = isoDate(new Date());

  const meals = useQuery({
    queryKey: ["shared", ownerId, "meals"],
    queryFn: () => getOwnerMeals(ownerId, daysAgo(30), today),
    enabled: granted.has("meals:read"),
  });
  const weight = useQuery({
    queryKey: ["shared", ownerId, "weight"],
    queryFn: () => getOwnerWeight(ownerId, daysAgo(90), today),
    enabled: granted.has("weight:read"),
  });
  const exercises = useQuery({
    queryKey: ["shared", ownerId, "exercises"],
    queryFn: () => getOwnerExercises(ownerId),
    enabled: granted.has("exercises:read"),
  });
  const foods = useQuery({
    queryKey: ["shared", ownerId, "foods"],
    queryFn: () => getOwnerFoods(ownerId),
    enabled: granted.has("foods:read"),
  });
  const goals = useQuery({
    queryKey: ["shared", ownerId, "goals"],
    queryFn: () => getOwnerGoals(ownerId),
    enabled: granted.has("goals:read"),
  });

  return (
    <div className="space-y-4 max-w-2xl">
      <Button variant="ghost" size="sm" render={<Link href="/compartir" />}>
        <ArrowLeft className="size-4 mr-1" />
        Compartir
      </Button>
      <h1 className="text-2xl font-semibold">
        Datos de {ownerName ? `@${ownerName}` : "otro usuario"}
      </h1>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : granted.size === 0 ? (
        <p className="text-sm text-muted-foreground">
          Este usuario no te comparte datos completos, o lo que te compartio ya no tiene efecto.
        </p>
      ) : null}

      {granted.has("meals:read") && (
        <Section title="Comidas de los ultimos 30 dias">
          {meals.data && meals.data.items.length > 0 ? (
            <ul className="divide-y divide-border">
              {meals.data.items.map((meal) => (
                <li key={meal.id} className="flex justify-between gap-4 py-2">
                  <span>
                    <span className="text-muted-foreground">{formatAr(meal.date, "dd/MM")}</span>{" "}
                    {meal.name || meal.type}
                  </span>
                  {meal.calories != null && <span>{fmtCal(meal.calories)} kcal</span>}
                </li>
              ))}
            </ul>
          ) : (
            <Empty loading={meals.isLoading} />
          )}
        </Section>
      )}

      {granted.has("weight:read") && (
        <Section title="Peso de los ultimos 90 dias">
          {weight.data && weight.data.items.length > 0 ? (
            <ul className="divide-y divide-border">
              {weight.data.items.map((entry) => (
                <li key={entry.id} className="flex justify-between gap-4 py-2">
                  <span className="text-muted-foreground">{formatAr(entry.date, "dd/MM/yyyy")}</span>
                  <span>{entry.weight_kg} kg</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty loading={weight.isLoading} />
          )}
        </Section>
      )}

      {granted.has("exercises:read") && (
        <Section title="Ultimos ejercicios">
          {exercises.data && exercises.data.items.length > 0 ? (
            <ul className="divide-y divide-border">
              {exercises.data.items.map((exercise) => (
                <li key={exercise.id} className="flex justify-between gap-4 py-2">
                  <span>
                    <span className="text-muted-foreground">{formatAr(exercise.date, "dd/MM")}</span>{" "}
                    {exercise.name}
                  </span>
                  {exercise.duration_seconds != null && <span>{fmtDuration(exercise.duration_seconds)}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <Empty loading={exercises.isLoading} />
          )}
        </Section>
      )}

      {granted.has("foods:read") && (
        <Section title="Alimentos">
          {foods.data && foods.data.items.length > 0 ? (
            <ul className="divide-y divide-border">
              {foods.data.items.map((food) => (
                <li key={food.id} className="flex justify-between gap-4 py-2">
                  <span>{food.name}</span>
                  {food.default_calories != null && (
                    <span className="text-muted-foreground">{fmtCal(food.default_calories)} kcal</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <Empty loading={foods.isLoading} />
          )}
        </Section>
      )}

      {granted.has("goals:read") && (
        <Section title="Metas">
          {goals.data ? (
            <ul className="space-y-1">
              {goals.data.daily_calories != null && <li>Calorias diarias: {fmtCal(goals.data.daily_calories)} kcal</li>}
              {goals.data.daily_protein_grams != null && (
                <li>Proteina diaria: {fmtGrams(goals.data.daily_protein_grams)} g</li>
              )}
              {goals.data.target_weight_kg != null && <li>Peso objetivo: {goals.data.target_weight_kg} kg</li>}
            </ul>
          ) : (
            <Empty loading={goals.isLoading} />
          )}
        </Section>
      )}
    </div>
  );
}
