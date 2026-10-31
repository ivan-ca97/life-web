import { useQuery } from "@tanstack/react-query";
import * as permissionsApi from "@/lib/api/permissions";

export function useShareablePermissions() {
  return useQuery({
    queryKey: ["permissions", "shareable"],
    queryFn: () => permissionsApi.getMyPermissions(true),
  });
}
