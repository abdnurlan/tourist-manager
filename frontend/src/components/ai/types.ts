import type { EventSource } from "@/lib/types";

/** A single message rendered in the live chat thread. */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  /** Visible text. `null` while an assistant reply is still streaming/thinking. */
  content: string | null;
  /** Pending = optimistic user message or thinking assistant placeholder. */
  pending?: boolean;
  /** For assistant messages, where the reply came from (CONTRACT §6.7). */
  source?: EventSource;
  /** RFC timestamp; absent for optimistic messages (shown as "indi"). */
  createdAt?: string;
}
