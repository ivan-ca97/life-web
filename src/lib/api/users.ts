import { apiFetch } from "./client";
import type { User, UserPage, CreateUserRequest, UpdateUserRequest, PublicUser } from "@/lib/types/user";

export function getUsers(params: {
  limit?: number;
  offset?: number;
}): Promise<UserPage> {
  const search = new URLSearchParams();
  if (params.limit) search.set("limit", String(params.limit));
  if (params.offset) search.set("offset", String(params.offset));
  return apiFetch<UserPage>(`/users?${search}`);
}

export function getUser(id: string): Promise<User> {
  return apiFetch<User>(`/users/${id}`);
}

export function createUser(data: CreateUserRequest): Promise<User> {
  return apiFetch<User>("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateUser(id: string, data: UpdateUserRequest): Promise<User> {
  return apiFetch<User>(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteUser(id: string): Promise<void> {
  return apiFetch<void>(`/users/${id}`, { method: "DELETE" });
}

/** Users who chose to be found whose username contains the text. */
export function searchUsers(text: string): Promise<{ items: PublicUser[] }> {
  return apiFetch<{ items: PublicUser[] }>(`/users/search?q=${encodeURIComponent(text)}&limit=8`);
}

/** The username of a user the current one can see; not found for anyone else. */
export function getUserProfile(id: string): Promise<PublicUser> {
  return apiFetch<PublicUser>(`/users/${id}/profile`);
}
