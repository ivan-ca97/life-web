import type { PaginatedResponse } from "./api";

export interface User {
  id: string;
  email: string;
  username?: string;
  active: boolean;
  height_cm?: number;
  birth_date?: string;
  sex?: string;
  photo_url: string;
  /** Whether other users can find them by their username, to share with them. */
  discoverable: boolean;
  created_at: string;
}

/** All a user can learn about another one: their username. */
export interface PublicUser {
  id: string;
  username?: string;
}

export type UserPage = PaginatedResponse<User>;

export interface CreateUserRequest {
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  email?: string;
  username?: string;
  password?: string;
  height_cm?: number;
  birth_date?: string;
  sex?: string;
  discoverable?: boolean;
}
