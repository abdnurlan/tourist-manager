import { api } from "./axios";
import type { DashboardResponse } from "@/lib/types";

/** GET /dashboard — protected. Composite aggregate. */
export async function getDashboard(): Promise<DashboardResponse> {
  const { data } = await api.get<DashboardResponse>("/dashboard");
  return data;
}
