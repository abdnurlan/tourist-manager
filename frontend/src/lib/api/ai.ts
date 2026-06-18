import { api } from "./axios";
import type {
  AiChatRequest,
  AiChatResponse,
  AiHistoryItem,
  ListResponse,
} from "@/lib/types";

/** POST /ai/chat — protected. Returns AZ reply + intent. */
export async function aiChat(body: AiChatRequest): Promise<AiChatResponse> {
  const { data } = await api.post<AiChatResponse>("/ai/chat", body);
  return data;
}

/** GET /ai/history — protected. Newest-first (cap ~50). */
export async function aiHistory(): Promise<AiHistoryItem[]> {
  const { data } = await api.get<ListResponse<AiHistoryItem>>("/ai/history");
  return data.data;
}
