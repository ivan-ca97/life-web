const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )life_token=([^;]*)/);
  if (!match) return null;
  return decodeURIComponent(match[1]);
}

export function setToken(token: string, expiresAt: string): void {
  const expires = new Date(expiresAt).toUTCString();
  document.cookie = `life_token=${encodeURIComponent(token)}; expires=${expires}; path=/`;
}

export function clearToken(): void {
  document.cookie = "life_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new ApiError(401, "No autorizado");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Error desconocido" }));
    throw new ApiError(response.status, body.error);
  }

  return response.json();
}
