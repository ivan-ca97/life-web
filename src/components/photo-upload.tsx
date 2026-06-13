"use client";

import { useState, useRef, useCallback } from "react";
import { ImagePlus, X, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaUpload, type UploadedPhoto } from "@/lib/hooks/use-media";
import { toast } from "sonner";

const ACCEPTED = "image/jpeg,image/png,image/webp";

interface PhotoUploadProps {
  photos: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
}

export function PhotoUpload({ photos, onChange }: PhotoUploadProps) {
  const { uploadFiles, uploading, progress } = useMediaUpload();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) =>
        ["image/jpeg", "image/png", "image/webp"].includes(f.type)
      );
      if (arr.length === 0) return;
      try {
        const urls = await uploadFiles(arr);
        const newPhotos: UploadedPhoto[] = urls.map((url) => ({
          url,
          is_primary: false,
        }));
        const combined = [...photos, ...newPhotos];
        if (!combined.some((p) => p.is_primary) && combined.length > 0) {
          combined[0].is_primary = true;
        }
        onChange(combined);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Error al subir fotos"
        );
      }
    },
    [photos, onChange, uploadFiles]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleRemove(index: number) {
    const updated = photos.filter((_, i) => i !== index);
    if (photos[index].is_primary && updated.length > 0) {
      updated[0].is_primary = true;
    }
    onChange(updated);
  }

  function handleSetPrimary(index: number) {
    const updated = photos.map((p, i) => ({
      ...p,
      is_primary: i === index,
    }));
    onChange(updated);
  }

  return (
    <div className="space-y-2">
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((photo, index) => (
            <div key={photo.url} className="relative size-20 rounded-md overflow-hidden border">
              <img
                src={photo.url}
                alt=""
                className="size-full object-cover"
              />
              <button
                type="button"
                className={`absolute top-0.5 left-0.5 p-0.5 rounded-sm transition-colors ${
                  photo.is_primary
                    ? "text-yellow-400"
                    : "text-white/50 hover:text-yellow-400"
                }`}
                onClick={() => handleSetPrimary(index)}
                title="Foto principal"
              >
                <Star className={`size-3.5 ${photo.is_primary ? "fill-yellow-400" : ""}`} />
              </button>
              <button
                type="button"
                className="absolute top-0.5 right-0.5 p-0.5 rounded-sm text-white/50 hover:text-red-400 transition-colors"
                onClick={() => handleRemove(index)}
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`flex items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 cursor-pointer transition-colors text-sm text-muted-foreground ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>
              Subiendo {progress.done}/{progress.total}...
            </span>
          </>
        ) : (
          <>
            <ImagePlus className="size-4" />
            <span>Arrastra fotos o haz click para seleccionar</span>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
