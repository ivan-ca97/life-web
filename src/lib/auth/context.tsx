"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  getToken,
  setToken,
  clearToken,
  getUserId,
  setUserId,
  clearUserId,
} from "@/lib/api/client";
import * as authApi from "@/lib/api/auth";

interface AuthContextValue {
  token: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [userIdState, setUserIdState] = useState<string | null>(() => getUserId());

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    setToken(response.token, response.expires_at);
    setUserId(response.user_id, response.expires_at);
    setTokenState(response.token);
    setUserIdState(response.user_id);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const response = await authApi.register({ email, password });
    setToken(response.token, response.expires_at);
    setUserId(response.user_id, response.expires_at);
    setTokenState(response.token);
    setUserIdState(response.user_id);
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    const response = await authApi.loginWithGoogle({ id_token: idToken });
    setToken(response.token, response.expires_at);
    setUserId(response.user_id, response.expires_at);
    setTokenState(response.token);
    setUserIdState(response.user_id);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors
    }
    clearToken();
    clearUserId();
    setTokenState(null);
    setUserIdState(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      userId: userIdState,
      isAuthenticated: token !== null,
      login,
      register,
      loginWithGoogle,
      logout,
    }),
    [token, userIdState, login, register, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
