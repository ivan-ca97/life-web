import type { PaginatedResponse } from "./api";

export interface User {
  id: string;
  email: string;
  active: boolean;
  created_at: string;
}

export type UserPage = PaginatedResponse<User>;

export interface CreateUserRequest {
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
}
