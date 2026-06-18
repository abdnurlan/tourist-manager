import { api } from "./axios";
import type { LoginRequest, LoginResponse, User, SuccessResponse } from "@/lib/types";

/** POST /auth/login — public. Returns token + user. */
export async function login(body: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", body);
  return data;
}

/** GET /auth/me — protected. Re-hydrates the current user. */
export async function me(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

/** POST /auth/logout — protected. Stateless; client discards token. */
export async function logout(): Promise<SuccessResponse> {
  const { data } = await api.post<SuccessResponse>("/auth/logout");
  return data;
}
