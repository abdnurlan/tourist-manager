"use client";

/* ─────────────────────────────────────────────────────────────
   AuthProvider + useAuth (CONTRACT §8)
   - token + user persisted in localStorage (tp_token / tp_user)
   - login() / logout(), bootstrap re-hydration via /auth/me
   ───────────────────────────────────────────────────────────── */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { LoginRequest, User } from "@/lib/types";
import * as authApi from "@/lib/api/auth";
import {
  TOKEN_KEY,
  USER_KEY,
  getToken,
  setToken as persistToken,
  clearToken,
} from "@/lib/api/axios";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Bootstrap from localStorage, then verify against /auth/me.
  useEffect(() => {
    const existing = getToken();
    if (!existing) {
      setIsLoading(false);
      return;
    }
    setTokenState(existing);
    setUser(readStoredUser());

    authApi
      .me()
      .then((fresh) => {
        setUser(fresh);
        window.localStorage.setItem(USER_KEY, JSON.stringify(fresh));
      })
      .catch(() => {
        // 401 handled by axios interceptor (clears + redirects).
        clearToken();
        setTokenState(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<User> => {
    const { token: tok, user: usr } = await authApi.login(credentials);
    persistToken(tok);
    window.localStorage.setItem(USER_KEY, JSON.stringify(usr));
    setTokenState(tok);
    setUser(usr);
    return usr;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch {
      // stateless; ignore server outcome
    } finally {
      clearToken();
      setTokenState(null);
      setUser(null);
    }
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    const fresh = await authApi.me();
    setUser(fresh);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(USER_KEY, JSON.stringify(fresh));
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      logout,
      refresh,
    }),
    [user, token, isLoading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export { TOKEN_KEY, USER_KEY };
