import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Code2, GraduationCap } from "lucide-react";

import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ModePicker } from "@/components/chat/ModePicker";
import { TypingDots } from "@/components/chat/TypingDots";

const goldyLogo = "/goldy-logo.png";

import {
  type ChatMessage,
  type Conversation,
  type Mode,
  createConversation,
  deriveTitle,
  loadConversations,
  saveConversations,
} from "@/lib/frontend-chat-storage";

export const Route = createFileRoute("/")({
  component: ChatPage,

  head: () => ({
    meta: [
      { title: "Chat With Goldy — AI Chat Assistant" },

      {
        name: "description",
        content:
          "Goldy is a smart AI assistant with coding and study modes.",
      },
    ],
  }),
});

const SUGGESTIONS = [
  {
    mode: "general" as Mode,
    icon: Sparkles,
    title: "Plan my day",
    prompt: "Help me plan my day productively.",
  },

  {
    mode: "coding" as Mode,
    icon: Code2,
    title: "Explain React",
    prompt: "Explain React useEffect simply.",
  },

  {
    mode: "study" as Mode,
    icon: GraduationCap,
    title: "Quiz me",
    prompt: "Quiz me on Big-O notation.",
  },
];

function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("general");
  const [isStreaming, setIsStreaming] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loaded = loadConversations();

    setConversations(loaded);

    if (loaded.length > 0) {
      setActiveId(loaded[0].id);
      setMode(loaded[0].mode);
    }
  }, []);

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [active?.messages]);

  const handleNew = () => {
    const convo = createConversation(mode);

    setConversations((prev) => [convo, ...prev]);

    setActiveId(convo.id);
  };

  const handleDelete = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));

    if (activeId === id) {
      setActiveId(null);
    }
  };

  const updateConvo = (
    id: string,
    updater: (c: Conversation) => Conversation,
  ) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? updater(c) : c)),
    );
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const send = async (text: string, presetMode?: Mode) => {
    const useMode = presetMode ?? mode;

    let convo = active;

    if (!convo) {
      convo = createConversation(useMode);

      setConversations((prev) => [convo!, ...prev]);

      setActiveId(convo.id);
    }

    const convoId = convo.id;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    updateConvo(convoId, (c) => ({
      ...c,
      title: c.messages.length === 0 ? deriveTitle(text) : c.title,
      mode: useMode,
      messages: [...c.messages, userMsg, assistantMsg],
      updatedAt: Date.now(),
    }));

    setIsStreaming(true);

    const controller = new AbortController();

    abortRef.current = controller;

    try {
      const history = [...convo.messages, userMsg]
        .filter((m) => m.content.trim() !== "")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const resp = await fetch("/api/chat-backend", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          messages: history,
          mode: useMode,
        }),

        signal: controller.signal,
      });

      const data = await resp.json();

      if (!resp.ok) {
        updateConvo(convoId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === assistantMsg.id
              ? {
                  ...m,
                  content: `⚠️ ${data.error || "Something went wrong"}`,
                }
              : m,
          ),
        }));

        setIsStreaming(false);

        return;
      }

      const aiText = data.content || "No response generated.";

      updateConvo(convoId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: aiText }
            : m,
        ),
      }));
    } catch (error) {
      console.error(error);

      updateConvo(convoId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === assistantMsg.id
            ? {
                ...m,
                content: "⚠️ Connection error.",
              }
            : m,
        ),
      }));
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const showEmpty = !active || active.messages.length === 0;

  return (
    <div className="flex h-screen bg-background text-foreground">
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={(id) => {
          setActiveId(id);

          const convo = conversations.find((c) => c.id === id);

          if (convo) {
            setMode(convo.mode);
          }
        }}
        onNew={handleNew}
        onDelete={handleDelete}
      />

      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <img
              src={goldyLogo}
              alt="Goldy"
              className="w-8 h-8 rounded-full"
            />

            <h1 className="text-lg font-bold text-gradient">
              Goldy
            </h1>
          </div>

          <ModePicker
            value={mode}
            onChange={setMode}
            disabled={isStreaming}
          />
        </header>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-6"
        >
          {showEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <img
                src={goldyLogo}
                alt="Goldy"
                className="w-20 h-20 rounded-2xl mb-5"
              />

              <h2 className="text-4xl font-bold">
                Hi, I'm Goldy ✨
              </h2>

              <p className="text-muted-foreground mt-2">
                Your AI assistant for coding and study help.
              </p>

              <div className="grid sm:grid-cols-3 gap-3 mt-8 max-w-2xl">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.title}
                    onClick={() => {
                      setMode(s.mode);
                      send(s.prompt, s.mode);
                    }}
                    className="p-4 rounded-xl border border-border hover:border-primary"
                  >
                    <s.icon className="w-5 h-5 text-primary mb-2" />

                    <div className="font-medium text-sm">
                      {s.title}
                    </div>

                    <div className="text-xs text-muted-foreground mt-1">
                      {s.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-5">
              {active.messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                />
              ))}

              {isStreaming && (
                <div className="flex gap-3">
                  <img
                    src={goldyLogo}
                    alt=""
                    className="w-9 h-9 rounded-full"
                  />

                  <div className="px-4 py-3 rounded-2xl bg-card border border-border">
                    <TypingDots />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <ChatInput
          onSend={(t) => send(t)}
          isStreaming={isStreaming}
          onStop={handleStop}
        />
      </main>
    </div>
  );
}
