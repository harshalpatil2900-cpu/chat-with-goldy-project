import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Code2, GraduationCap, Moon, Sun } from "lucide-react";

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
        content: "Goldy is a smart AI assistant with coding and study modes.",
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
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [voiceAccent, setVoiceAccent] = useState<"en-IN" | "en-US">("en-IN");

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("goldy-theme") as
      | "dark"
      | "light"
      | null;

    const selectedTheme = savedTheme ?? "dark";
    setTheme(selectedTheme);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(selectedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(theme);
    localStorage.setItem("goldy-theme", theme);
  }, [theme]);

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
          m.id === assistantMsg.id ? { ...m, content: aiText } : m,
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
    <div className="app-shell relative min-h-screen overflow-hidden text-[#F8FAFC] animate-fade-in">
      <div className="ai-background pointer-events-none absolute inset-0 -z-10">
        <div className="ai-orb ai-orb-1" />
        <div className="ai-orb ai-orb-2" />
        <div className="ai-orb ai-orb-3" />
        <div className="ai-particles">
          <span className="particle particle-1" />
          <span className="particle particle-2" />
          <span className="particle particle-3" />
          <span className="particle particle-4" />
          <span className="particle particle-5" />
        </div>
      </div>

      <div className="relative z-10 flex min-h-screen">
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
          <header className="border-b border-white/10 bg-card backdrop-blur-xl px-6 py-5 shadow-[0_1px_0_rgba(255,255,255,0.04)] animate-slide-up-sm stagger-1">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/10 shadow-lg">
                  <img
                    src={goldyLogo}
                    alt="Goldy"
                    className="h-11 w-11 rounded-2xl object-cover"
                  />
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.32em] text-muted">
                    Premium AI Assistant
                  </p>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    Goldy AI
                  </h1>
                  <p className="mt-1 max-w-2xl text-sm text-muted">
                    A modern AI assistant for coding, study, and productivity with premium SaaS polish.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-card px-4 py-3 text-sm font-medium text-foreground transition-smooth hover-scale btn-glow"
                  title="Toggle dark/light mode"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="w-4 h-4" />
                      Light
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4" />
                      Dark
                    </>
                  )}
                </button>

                <select
                  value={voiceAccent}
                  onChange={(e) =>
                    setVoiceAccent(e.target.value as "en-IN" | "en-US")
                  }
                  className="rounded-2xl border border-white/10 bg-card px-4 py-3 text-sm text-foreground outline-none transition-smooth hover-scale focus-glow hover:border-[#7C3AED]"
                  title="Select voice accent"
                >
                  <option value="en-IN">🇮🇳 Indian</option>
                  <option value="en-US">🇺🇸 American</option>
                </select>

                <ModePicker
                  value={mode}
                  onChange={setMode}
                  disabled={isStreaming}
                />
              </div>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
            {showEmpty ? (
              <div className="mx-auto flex max-w-6xl flex-col gap-10 rounded-[2rem] border border-white/10 bg-card p-8 shadow-[0_80px_120px_rgba(0,0,0,0.2)] backdrop-blur-xl animate-scale-in stagger-2">
                <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr] items-center">
                  <div>
                    <p className="text-sm uppercase tracking-[0.4em] text-muted">
                      Welcome to Goldy
                    </p>
                    <h2 className="mt-4 text-4xl font-semibold leading-tight text-foreground">
                      The premium AI assistant for smarter work and sharper learning.
                    </h2>
                    <p className="mt-4 text-base leading-7 text-muted">
                      Goldy brings you instant guidance, code assistance, and study support with a polished AI SaaS experience.
                    </p>
                    <div className="mt-8 grid gap-4 sm:grid-cols-3">
                      {SUGGESTIONS.map((s, idx) => (
                        <button
                          key={s.title}
                          onClick={() => {
                            setMode(s.mode);
                            send(s.prompt, s.mode);
                          }}
                          className="group rounded-[1.5rem] border border-white/10 bg-[#0F172A]/80 p-5 text-left transition-smooth hover-scale card-hover animate-slide-up-sm"
                          style={{ animationDelay: `${idx * 100}ms` }}
                        >
                          <s.icon className="mb-3 h-5 w-5 text-[#7C3AED] transition-smooth group-hover:text-[#06B6D4]" />
                          <div className="text-base font-semibold text-white">{s.title}</div>
                          <p className="mt-2 text-sm text-slate-400">{s.prompt}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-white/10 bg-card p-6 shadow-[0_30px_90px_rgba(0,0,0,0.2)] backdrop-blur-xl card-hover animate-slide-up-sm stagger-3">
                    <p className="text-sm uppercase tracking-[0.4em] text-muted">
                      Goldy Branding
                    </p>
                    <h3 className="mt-4 text-2xl font-semibold text-foreground">
                      Built for product teams, students, and developers.
                    </h3>
                    <div className="mt-6 space-y-4 text-sm text-muted">
                      <div className="rounded-3xl border border-white/10 bg-card p-4 card-hover transition-smooth animate-slide-up-sm stagger-1">
                        Fast answers with polished result cards.
                      </div>
                      <div className="rounded-3xl border border-white/10 bg-card p-4 card-hover transition-smooth animate-slide-up-sm stagger-2">
                        Premium voice and copy tools built in.
                      </div>
                      <div className="rounded-3xl border border-white/10 bg-card p-4 card-hover transition-smooth animate-slide-up-sm stagger-3">
                        Modern SaaS layout with elegant spacing.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-5xl space-y-6">
                {active.messages.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    voiceAccent={voiceAccent}
                  />
                ))}

                {isStreaming && (
                  <div className="flex gap-3 rounded-[1.5rem] border border-white/10 bg-card p-4 shadow-[0_30px_90px_rgba(0,0,0,0.16)] backdrop-blur-xl animate-float-up">
                    <img
                      src={goldyLogo}
                      alt=""
                      className="w-11 h-11 rounded-2xl"
                    />

                    <div className="flex-1 rounded-[1.5rem] border border-white/10 bg-card p-4 text-sm text-muted">
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
    </div>
  );
}