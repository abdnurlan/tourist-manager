"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { History } from "lucide-react";
import { aiChat } from "@/lib/api/ai";
import { queryKeys } from "@/lib/query";
import { az } from "@/lib/i18n/az";
import type { AiChatRequest, AiChatResponse } from "@/lib/types";

import { PageHeader, PageBody } from "@/components/layout/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { ChatBubble } from "@/components/ai/chat-bubble";
import { ThinkingBubble } from "@/components/ai/thinking-bubble";
import { ChatComposer } from "@/components/ai/chat-composer";
import { ChatIntro } from "@/components/ai/chat-intro";
import { SuggestionChips } from "@/components/ai/suggestion-chips";
import { HistoryPanel } from "@/components/ai/history-panel";
import type { ChatMessage } from "@/components/ai/types";

let msgSeq = 0;
const nextId = () => `local-${Date.now()}-${msgSeq++}`;

export default function AiAssistantPage() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState<{ text: string; nonce: number } | null>(
    null,
  );
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const chat = useMutation<AiChatResponse, unknown, { userId: string; body: AiChatRequest }>({
    mutationFn: ({ body }) => aiChat(body),
    onSuccess: (res) => {
      // Replace the pending thinking bubble with the real reply.
      setMessages((prev) =>
        prev.map((m) =>
          m.pending && m.role === "assistant"
            ? {
                ...m,
                content: res.reply,
                source: res.source,
                pending: false,
                createdAt: new Date().toISOString(),
              }
            : m,
        ),
      );
      // Web chat is logged server-side; refresh the history rail.
      queryClient.invalidateQueries({ queryKey: queryKeys.aiHistory });
    },
    onError: () => {
      setMessages((prev) =>
        prev.map((m) =>
          m.pending && m.role === "assistant"
            ? {
                ...m,
                content: az.ai.error_reply,
                source: "ai",
                pending: false,
                createdAt: new Date().toISOString(),
              }
            : m,
        ),
      );
    },
  });

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || chat.isPending) return;

      const userId = nextId();
      // Optimistic: append the user bubble + an assistant "thinking" placeholder.
      setMessages((prev) => [
        ...prev,
        {
          id: userId,
          role: "user",
          content: trimmed,
          createdAt: new Date().toISOString(),
        },
        { id: nextId(), role: "assistant", content: null, pending: true },
      ]);

      chat.mutate({ userId, body: { message: trimmed } });
    },
    [chat],
  );

  const handleSuggestion = useCallback((text: string) => {
    // Load into composer so the user can review/edit before sending.
    setDraft({ text, nonce: Date.now() });
  }, []);

  // Keep the thread pinned to the newest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const isEmpty = messages.length === 0;

  return (
    <PageTransition className="flex h-full min-h-0 flex-col">
      <PageHeader
        title={az.ai.title}
        subtitle={az.ai.subtitle}
        actions={
          // Mobile-only history trigger (rail is always visible on desktop).
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary" size="sm">
                  <History className="size-4" />
                  {az.ai.history}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-md p-0 sm:max-w-md">
                <SheetTitle className="sr-only">{az.ai.history_title}</SheetTitle>
                <HistoryPanel className="h-full rounded-none border-0" />
              </SheetContent>
            </Sheet>
          </div>
        }
      />

      <PageBody className="flex min-h-0 flex-1 gap-6 pb-0">
        {/* Chat column — an open journal page */}
        <section className="relative flex min-h-0 flex-1 flex-col">
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 pb-6 pt-1">
              {isEmpty ? (
                <ChatIntro
                  onSelectSuggestion={handleSuggestion}
                  disabled={chat.isPending}
                />
              ) : (
                <AnimatePresence initial={false} mode="popLayout">
                  {messages.map((m) =>
                    m.pending && m.role === "assistant" ? (
                      <ThinkingBubble key={m.id} />
                    ) : (
                      <ChatBubble key={m.id} message={m} />
                    ),
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Composer + (when chatting) compact suggestion row.
              pb-safe clears the mobile bottom-nav; the FAB is hidden on /ai. */}
          <div className="sticky bottom-0 mx-auto w-full max-w-2xl bg-gradient-to-t from-background via-background to-transparent pb-safe pt-3 md:pb-4">
            {!isEmpty && (
              <SuggestionChips
                onSelect={handleSuggestion}
                disabled={chat.isPending}
                className="mb-3"
              />
            )}
            <ChatComposer
              onSend={send}
              disabled={chat.isPending}
              draft={draft?.text}
              draftNonce={draft?.nonce}
            />
          </div>
        </section>

        {/* History rail (desktop) */}
        <HistoryPanel className="hidden w-80 shrink-0 lg:flex" />
      </PageBody>
    </PageTransition>
  );
}
