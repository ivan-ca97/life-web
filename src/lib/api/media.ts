import { userFetch } from "./client";
import type { UploadURLRequest, UploadURLResponse } from "@/lib/types/daily-photo";

export function getUploadUrl(data: UploadURLRequest): Promise<UploadURLResponse> {
  return userFetch<UploadURLResponse>("/media/upload-url", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function uploadFile(file: File): Promise<string> {
  const { upload_url, public_url } = await getUploadUrl({
    filename: file.name,
    content_type: file.type,
  });

  await fetch(upload_url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  return public_url;
}
