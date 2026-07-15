import { useQuery } from "@tanstack/react-query";
import { getLatestRelease } from "@/lib/api/app-update";

export function useLatestRelease(platform = "android") {
  return useQuery({
    queryKey: ["app-latest", platform],
    queryFn: () => getLatestRelease(platform),
    staleTime: 1000 * 60 * 30,
  });
}
