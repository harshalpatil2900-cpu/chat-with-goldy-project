import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Code2, GraduationCap, Moon, Sun, Plus } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ModePicker } from "@/components/chat/ModePicker";
import { TypingDots } from "@/components/chat/TypingDots";
import { AuthBox } from "@/components/auth/AuthBox";
import { supabase } from "@/integrations/supabase/client";

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

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, mode: useMode }),
        signal: controller.signal,
      });

      const data = await resp.json();

      if (!resp.ok) {
        updateConvo(convoId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: `⚠️ ${data.error || "Something went wrong"}` }
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
            ? { ...m, content: "⚠️ Connection error." }
            : m,
        ),
      }));
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const showEmpty = !active || active.messages.length === 0;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        Loading Goldy AI...
      </div>
    );
  }

  if (!user) {
    return <AuthBox />;
  }

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
            if (convo) setMode(convo.mode);
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
                    Learn faster, code smarter, and achieve more with Goldy AI.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleNew}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-3 py-2 text-sm font-medium text-white md:hidden"
                  title="New chat"
                >
                  <Plus className="w-4 h-4" />
                  New
                </button>

                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-card px-4 py-3 text-sm font-medium text-foreground transition-smooth hover-scale btn-glow"
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
                >
                  <option value="en-IN">🇮🇳 Indian</option>
                  <option value="en-US">🇺🇸 American</option>
                </select>

                <ModePicker
                  value={mode}
                  onChange={setMode}
                  disabled={isStreaming}
                />

                <button
                  onClick={handleLogout}
                  className="rounded-2xl border border-white/10 bg-card px-4 py-3 text-sm font-medium text-foreground transition-smooth hover:bg-red-500/20 hover:text-red-300"
                >
                  Logout
                </button>
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
                      The Premium AI assistant for Smarter work and Sharper learning.
                    </h2>
                    <p className="mt-4 text-base leading-7 text-muted">
                      Goldy brings you instant guidance, code assistance, and study support with a polished AI SaaS experience.
                    </p>

                    <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-3">
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
                          <div className="text-base font-semibold text-white">
                            {s.title}
                          </div>
                          <p className="mt-2 text-sm text-slate-400">
                            {s.prompt}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 flex flex-col items-center justify-start text-center shadow-xl">
                    <p className="text-xs tracking-[0.35em] text-muted-foreground uppercase mb-6">
                      GOLDY BRANDING
                    </p>

                    <img
                      src="/herosection.png" 
                      alt="Goldy Branding"
                      className="w-[220px] sm:w-[280px] md:w-[380px] lg:w-[500px] xl:w-[600px] h-auto object-contain rounded-3xl drop-shadow-2xl -mt-20 md:-mt-32 ml-2 md:ml-6 translate-y-2 md:translate-y-4"
                    />
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