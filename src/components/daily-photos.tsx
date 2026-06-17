"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Star, X } from "lucide-react";
import { useDailyPhotos, useUploadDailyPhoto, useUpdateDailyPhoto, useDeleteDailyPhoto } from "@/lib/hooks/use-daily-photos";
import { PannableImage } from "@/components/pannable-image";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { DailyPhoto } from "@/lib/types/daily-photo";

interface DailyPhotosProps {
  date: string;
  closed: boolean;
}

export function DailyPhotos({ date, closed }: DailyPhotosProps) {
  const { data } = useDailyPhotos(date);
  const uploadMutation = useUploadDailyPhoto();
  const updateMutation = useUpdateDailyPhoto();
  const deleteMutation = useDeleteDailyPhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<DailyPhoto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DailyPhoto | null>(null);

  const photos = data?.items ?? [];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} no es una imagen`);
        continue;
      }
      uploadMutation.mutate(
        { file, date },
        { onError: (err) => toast.error(err.message) },
      );
    }

    e.target.value = "";
  }

  function handleSetPrimary(photo: DailyPhoto) {
    if (photo.is_primary) return;
    updateMutation.mutate(
      { id: photo.id, data: { is_primary: true } },
      { onError: (err) => toast.error(err.message) },
    );
  }

  function handleDelete(photo: DailyPhoto) {
    deleteMutation.mutate(photo.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        if (expandedPhoto?.id === photo.id) setExpandedPhoto(null);
      },
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fotos del dia ({photos.length})</CardTitle>
          {!closed && (
            <CardAction>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                <Plus className="size-4" />
                {uploadMutation.isPending ? "Subiendo..." : "Agregar"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin fotos para este dia.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="group relative aspect-square rounded-lg overflow-hidden border">
                  <PannableImage
                    src={photo.url}
                    alt={photo.name || "Foto del dia"}
                    className="size-full object-cover cursor-pointer"
                    onClick={() => setExpandedPhoto(photo)}
                  />
                  {photo.is_primary && (
                    <div className="absolute top-1.5 left-1.5 rounded-full bg-amber-500 p-1">
                      <Star className="size-3 fill-white text-white" />
                    </div>
                  )}
                  {!closed && (
                    <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!photo.is_primary && (
                        <button
                          type="button"
                          className="rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetPrimary(photo);
                          }}
                        >
                          <Star className="size-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="rounded-full bg-black/60 p-1.5 text-white hover:bg-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(photo);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expanded photo view */}
      {expandedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setExpandedPhoto(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/40"
            onClick={() => setExpandedPhoto(null)}
          >
            <X className="size-6" />
          </button>
          <img
            src={expandedPhoto.url}
            alt={expandedPhoto.name || "Foto del dia"}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar foto</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminara la foto permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
