import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as profilePhotosApi from "@/lib/api/profile-photos";
import { uploadFile } from "@/lib/api/media";

export function useProfilePhotos() {
  return useQuery({
    queryKey: ["profile-photos"],
    queryFn: () => profilePhotosApi.getProfilePhotos({ limit: 20 }),
  });
}

export function useUploadProfilePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const publicUrl = await uploadFile(file);
      return profilePhotosApi.createProfilePhoto({ url: publicUrl });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile-photos"] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
