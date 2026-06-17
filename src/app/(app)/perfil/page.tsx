"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Camera, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useUser, useUpdateUser } from "@/lib/hooks/use-users";
import { useProfilePhotos, useUploadProfilePhoto } from "@/lib/hooks/use-profile-photos";
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

const SEX_LABELS: Record<string, string> = {
  male: "Masculino",
  female: "Femenino",
};

export default function PerfilPage() {
  const { userId } = useAuth();
  const { data: user, isLoading } = useUser(userId ?? "");
  const updateMutation = useUpdateUser(userId ?? "");
  const uploadPhotoMutation = useUploadProfilePhoto();
  const { data: photosData } = useProfilePhotos();

  const [heightCm, setHeightCm] = useState<string>("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState("");
  const [password, setPassword] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

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

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    e.target.value = "";
    uploadPhotoMutation.mutate(file, {
      onSuccess: () => toast.success("Foto actualizada"),
      onError: (err) => toast.error(err.message ?? "Error al subir la foto"),
    });
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

  const photos = photosData?.items ?? [];

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-2xl font-semibold">Perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informacion personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative group size-20 shrink-0 rounded-full overflow-hidden bg-muted border cursor-pointer"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadPhotoMutation.isPending}
            >
              {user.photo_url ? (
                <img src={user.photo_url} alt="Foto de perfil" className="size-full object-cover" />
              ) : (
                <span className="flex items-center justify-center size-full text-2xl font-semibold text-muted-foreground">
                  {user.email[0].toUpperCase()}
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="size-5 text-white" />
              </div>
              {uploadPhotoMutation.isPending && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground">Click en la foto para cambiarla</p>
            </div>
          </div>

          {photos.length > 1 && (
            <div>
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                Historial de fotos ({photos.length})
              </button>
              {showHistory && (
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {photos.map((photo, i) => (
                    <div
                      key={photo.id}
                      className={`relative aspect-square rounded-lg overflow-hidden border ${i === 0 ? "ring-2 ring-primary" : ""}`}
                    >
                      <img
                        src={photo.url}
                        alt={`Foto ${i + 1}`}
                        className="size-full object-cover"
                      />
                      {i === 0 && (
                        <span className="absolute bottom-0.5 right-0.5 text-[10px] bg-primary text-primary-foreground px-1 rounded">
                          Actual
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
                  <SelectValue placeholder="—">
                    {SEX_LABELS[sex]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Femenino</SelectItem>
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
