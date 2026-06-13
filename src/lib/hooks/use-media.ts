import { useState, useCallback } from "react";
import { userFetch } from "@/lib/api/client";

interface UploadUrlResponse {
  upload_url: string;
  public_url: string;
}

export interface UploadedPhoto {
  url: string;
  is_primary: boolean;
}

function contentTypeFromFile(file: File): string {
  if (file.type === "image/png") return "image/png";
  if (file.type === "image/webp") return "image/webp";
  return "image/jpeg";
}

async function uploadSingleFile(file: File): Promise<string> {
  const contentType = contentTypeFromFile(file);
  const { upload_url, public_url } = await userFetch<UploadUrlResponse>(
    "/media/upload-url",
    {
      method: "POST",
      body: JSON.stringify({ filename: file.name, content_type: contentType }),
    }
  );
  await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  return public_url;
}

export function useMediaUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number }>({
    done: 0,
    total: 0,
  });

  const uploadFiles = useCallback(async (files: File[]) => {
    setUploading(true);
    setProgress({ done: 0, total: files.length });
    const urls: string[] = [];
    for (const file of files) {
      const url = await uploadSingleFile(file);
      urls.push(url);
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }
    setUploading(false);
    return urls;
  }, []);

  return { uploadFiles, uploading, progress };
}
