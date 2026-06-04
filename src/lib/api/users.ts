import { apiFetch } from "./client";
import type { User, UserPage, CreateUserRequest, UpdateUserRequest } from "@/lib/types/user";

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
