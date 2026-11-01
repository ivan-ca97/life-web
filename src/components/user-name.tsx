"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/lib/api/users";

/** The username of a user the current one can see, or a neutral label otherwise. */
export function UserName({ userId }: { userId?: string }) {
  const { data } = useQuery({
    queryKey: ["users", userId, "profile"],
    queryFn: () => getUserProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  if (!userId) return <>todos</>;
  return <>{data?.username ? `@${data.username}` : "un usuario sin nombre"}</>;
}
