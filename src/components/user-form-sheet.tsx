"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useCreateUser, useUpdateUser, useUser } from "@/lib/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface UserFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

export function UserFormSheet({ open, onOpenChange, userId }: UserFormSheetProps) {
  const isEditing = !!userId;
  const { data: user } = useUser(userId ?? "");
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser(userId ?? "");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState("");

  useEffect(() => {
    if (isEditing && user) {
      setEmail(user.email);
      setPassword("");
      setHeightCm(user.height_cm != null ? String(user.height_cm) : "");
      setBirthDate(user.birth_date ?? "");
      setSex(user.sex ?? "");
    } else if (!isEditing) {
      setEmail("");
      setPassword("");
      setHeightCm("");
      setBirthDate("");
      setSex("");
    }
  }, [isEditing, user]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEditing) {
      const data: Record<string, unknown> = {};
      if (email !== user?.email) data.email = email;
      if (password) data.password = password;
      data.height_cm = heightCm ? Number(heightCm) : undefined;
      data.birth_date = birthDate || undefined;
      data.sex = sex || undefined;

      updateMutation.mutate(data as Parameters<typeof updateMutation.mutate>[0], {
        onSuccess: () => {
          toast.success("Usuario actualizado");
          onOpenChange(false);
        },
        onError: (err) => toast.error(err.message),
      });
    } else {
      createMutation.mutate(
        { email, password },
        {
          onSuccess: () => {
            toast.success("Usuario creado");
            setEmail("");
            setPassword("");
            onOpenChange(false);
          },
          onError: (err) => toast.error(err.message),
        }
      );
    }
  }

  const isPending = isEditing ? updateMutation.isPending : createMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEditing ? "Editar usuario" : "Nuevo usuario"}</SheetTitle>
          <SheetDescription>
            {isEditing ? "Modifica los datos del usuario." : "Crea una cuenta de usuario."}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              required
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-password">
              {isEditing ? "Nueva password (dejar vacio para no cambiar)" : "Password"}
            </Label>
            <Input
              id="user-password"
              type="password"
              required={!isEditing}
              minLength={8}
              placeholder="Minimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-height">Altura (cm)</Label>
            <Input
              id="user-height"
              type="number"
              min="50"
              max="300"
              placeholder="170"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-birthdate">Fecha de nacimiento</Label>
            <Input
              id="user-birthdate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Sexo</Label>
            <Select value={sex} onValueChange={(v) => setSex(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male" label="Masculino">Masculino</SelectItem>
                <SelectItem value="female" label="Femenino">Femenino</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
