"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/context";
import { useUser, useUpdateUser } from "@/lib/hooks/use-users";
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
import { CardSkeleton } from "@/components/loading-skeleton";

export default function PerfilPage() {
  const { userId } = useAuth();
  const { data: user, isLoading } = useUser(userId ?? "");
  const updateMutation = useUpdateUser(userId ?? "");

  const [heightCm, setHeightCm] = useState<string>("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState("");
  const [password, setPassword] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (!initialized && user) {
    setHeightCm(user.height_cm != null ? String(user.height_cm) : "");
    setBirthDate(user.birth_date ?? "");
    setSex(user.sex ?? "");
    setInitialized(true);
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-lg">
        <h1 className="text-2xl font-semibold">Perfil</h1>
        <CardSkeleton />
      </div>
    );
  }

  if (!user) {
    return <p className="text-muted-foreground">No se pudo cargar el perfil</p>;
  }

  function handleSave() {
    const data: Record<string, unknown> = {};
    const h = Number(heightCm);
    if (heightCm && !isNaN(h) && h !== user!.height_cm) data.height_cm = h;
    if (birthDate && birthDate !== user!.birth_date) data.birth_date = birthDate;
    if (sex && sex !== user!.sex) data.sex = sex;
    if (password) data.password = password;

    if (Object.keys(data).length === 0) {
      toast.info("No hay cambios para guardar");
      return;
    }

    updateMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Perfil actualizado");
        setPassword("");
      },
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-2xl font-semibold">Perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informacion personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email} disabled />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height">Altura (cm)</Label>
              <Input
                id="height"
                type="number"
                min="0"
                max="300"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sex">Sexo</Label>
              <Select value={sex} onValueChange={(v) => setSex(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male" label="Masculino">Masculino</SelectItem>
                  <SelectItem value="female" label="Femenino">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthdate">Fecha de nacimiento</Label>
            <Input
              id="birthdate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cambiar contrasena</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contrasena</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Dejar vacio para no cambiar"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={updateMutation.isPending}>
        {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </div>
  );
}
