"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@/hooks/use-chat";
import { useJournal } from "@/hooks/use-journal";
import { MessageBubble } from "./message-bubble";
import { MessageInput } from "./message-input";
import { JournalCheckIn } from "@/components/journal/journal-check-in";
import { QuickLogPanel } from "@/components/quick-log/quick-log-panel";
import { Spinner, Tabs, EmptyState } from "@/components/ui";
import { MessageSquare, Zap } from "lucide-react";
import type { JournalScores } from "@/types";

type ChatMode = "chat" | "quick-log";

const MODE_TABS = [
  { value: "chat", label: "Chat", icon: MessageSquare },
  { value: "quick-log", label: "Quick Log", icon: Zap },
] as const;

export function ChatInterface() {
  const { messages, loading, sendMessage, loadHistory } = useChat();
  const { hasEntryToday, loading: journalLoading, saveScores } = useJournal();
  const [dismissed, setDismissed] = useState(false);
  const [mode, setMode] = useState<ChatMode>("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasLoaded = useRef(false);

  // Load history on mount
  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      loadHistory();
    }
  }, [loadHistory]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const showJournalCard = !journalLoading && !hasEntryToday && !dismissed && mode === "chat";

  async function handleJournalSave(scores: JournalScores) {
    await saveScores(scores);
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem-5rem)] flex-col md:h-[calc(100dvh-3.5rem)]">
      {/* Mode toggle */}
      <div className="flex items-center justify-center border-b border-[var(--color-border-light)] bg-[var(--color-surface-card)] px-4 py-2">
        <Tabs
          tabs={MODE_TABS.map((t) => ({ value: t.value, label: t.label, icon: t.icon }))}
          value={mode}
          onChange={(v) => setMode(v as ChatMode)}
        />
      </div>

      {mode === "quick-log" ? (
        <QuickLogPanel />
      ) : (
        <>
          {/* Messages area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4"
          >
            <div className="mx-auto max-w-2xl">
              {/* Journal check-in card */}
              {showJournalCard && (
                <div className="mb-4">
                  <JournalCheckIn
                    onSave={handleJournalSave}
                    onDismiss={() => setDismissed(true)}
                  />
                </div>
              )}

              {messages.length === 0 && !loading ? (
                <div className="pt-20">
                  <EmptyState
                    icon={<MessageSquare className="h-6 w-6" />}
                    title="Start a conversation"
                    description="Tell me what you ate, how you feel, or ask about your protocol. I'll track everything for you."
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}

                  {loading &&
                    messages.length > 0 &&
                    messages[messages.length - 1]?.role === "assistant" &&
                    messages[messages.length - 1]?.content === "" && (
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-muted)]">
                        <Spinner size="sm" />
                        <span>Thinking...</span>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Input area */}
          <div className="border-t border-[var(--color-border-light)] bg-[var(--color-surface-card)] px-4 py-3">
            <div className="mx-auto max-w-2xl">
              <MessageInput onSend={sendMessage} disabled={loading} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
