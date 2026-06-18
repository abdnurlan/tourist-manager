import { api } from "./axios";
import type { SearchResponse } from "@/lib/types";

/** GET /search?q= — protected. Global search across tours + events. */
export async function search(q: string): Promise<SearchResponse> {
  const { data } = await api.get<SearchResponse>("/search", { params: { q } });
  return data;
}
