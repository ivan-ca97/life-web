import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as photosApi from "@/lib/api/daily-photos";
import { uploadFile } from "@/lib/api/media";
import type { CreateDailyPhotoRequest, UpdateDailyPhotoRequest } from "@/lib/types/daily-photo";

export function useDailyPhotos(date: string) {
  return useQuery({
    queryKey: ["daily-photos", date],
    queryFn: () => photosApi.getDailyPhotos(date),
  });
}

export function useUploadDailyPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, date, name }: { file: File; date: string; name?: string }) => {
      const publicUrl = await uploadFile(file);
      return photosApi.createDailyPhoto({ date, url: publicUrl, name });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-photos"] });
    },
  });
}

export function useUpdateDailyPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDailyPhotoRequest }) =>
      photosApi.updateDailyPhoto(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-photos"] });
    },
  });
}

export function useDeleteDailyPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => photosApi.deleteDailyPhoto(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-photos"] });
    },
  });
}
