"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@/hooks/use-chat";
import { useJournal } from "@/hooks/use-journal";
import { MessageBubble } from "./message-bubble";
import { MessageInput } from "./message-input";
import { JournalCheckIn } from "@/components/journal/journal-check-in";
import { QuickLogPanel } from "@/components/quick-log/quick-log-panel";
import { Spinner } from "@/components/ui";
import { MessageSquare, Zap } from "lucide-react";
import type { JournalScores } from "@/types";

type ChatMode = "chat" | "quick-log";

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
      <div className="flex items-center justify-center border-b border-warm-200 bg-white px-4 py-2">
        <div className="inline-flex rounded-lg bg-warm-100 p-0.5">
          <button
            onClick={() => setMode("chat")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "chat"
                ? "bg-white text-warm-900 shadow-sm"
                : "text-warm-500 hover:text-warm-700"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Chat
          </button>
          <button
            onClick={() => setMode("quick-log")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "quick-log"
                ? "bg-white text-warm-900 shadow-sm"
                : "text-warm-500 hover:text-warm-700"
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            Quick Log
          </button>
        </div>
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
                <div className="flex h-full flex-col items-center justify-center pt-20 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <h2 className="mt-4 text-base font-semibold text-warm-900">
                    Start a conversation
                  </h2>
                  <p className="mt-1 max-w-xs text-sm text-warm-500">
                    Tell me what you ate, how you feel, or ask about your protocol.
                    I&apos;ll track everything for you.
                  </p>
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
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-warm-400">
                        <Spinner size="sm" />
                        <span>Thinking...</span>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Input area */}
          <div className="border-t border-warm-200 bg-white px-4 py-3">
            <div className="mx-auto max-w-2xl">
              <MessageInput onSend={sendMessage} disabled={loading} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
