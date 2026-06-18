/* ─────────────────────────────────────────────────────────────
   Axios instance (CONTRACT §1, §2.6, §5, §8)
   - baseURL = NEXT_PUBLIC_API_URL
   - request interceptor attaches Bearer token from localStorage
   - response interceptor unwraps + parses the AZ error shape, and on
     401 clears the token and redirects to /login.
   ───────────────────────────────────────────────────────────── */

import axios, { AxiosError, type AxiosInstance } from "axios";
import { az } from "@/lib/i18n/az";
import type { ApiError } from "@/lib/types";

export const TOKEN_KEY = "tp_token";
export const USER_KEY = "tp_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

// ── Request: attach Bearer token ───────────────────────────────
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.set?.("Authorization", `Bearer ${token}`);
  }
  return config;
});

/** Normalized client error surfaced to the UI / TanStack Query. */
export class ApiClientError extends Error {
  code: string;
  status: number;
  fields?: ApiError["fields"];

  constructor(message: string, code: string, status: number, fields?: ApiError["fields"]) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

// ── Response: parse AZ error shape; handle 401 ─────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: ApiError }>) => {
    // Network / no response
    if (!error.response) {
      return Promise.reject(
        new ApiClientError(az.toast.network_error, "NETWORK_ERROR", 0),
      );
    }

    const status = error.response.status;
    const payload = error.response.data?.error;
    const code = payload?.code ?? "INTERNAL_ERROR";
    const message = payload?.message ?? az.toast.error;
    const fields = payload?.fields;

    if (status === 401) {
      clearToken();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(new ApiClientError(message, code, status, fields));
  },
);

export default api;
