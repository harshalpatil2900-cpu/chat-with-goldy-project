import { useState } from "react";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { motion } from "motion/react";
import { Copy, Check, Clipboard, Volume2, VolumeX } from "lucide-react";

import type { ChatMessage } from "@/lib/frontend-chat-storage";

const goldyLogo = "/goldy-logo.png";

type VoiceAccent = "en-IN" | "en-US";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-smooth hover-scale"
      title="Copy code"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-400" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-gray-400" />
      )}
    </button>
  );
}

function SpeakButton({
  text,
  voiceAccent,
}: {
  text: string;
  voiceAccent: VoiceAccent;
}) {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = () => {
    if (!("speechSynthesis" in window)) {
      alert("Voice output is not supported in this browser.");
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const cleanText = text
      .replace(/```[\s\S]*?```/g, " code block skipped ")
      .replace(/[#*_`>|-]/g, " ")
      .slice(0, 1200);

    const utterance = new SpeechSynthesisUtterance(cleanText);

    utterance.lang = voiceAccent;
    utterance.rate = 0.95;
    utterance.pitch = 1;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      onClick={handleSpeak}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition-smooth hover-scale hover:bg-white/20"
      title={speaking ? "Stop speaking" : "Read aloud"}
    >
      {speaking ? (
        <VolumeX className="w-4 h-4 text-red-500" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
    </button>
  );
}

function FullResponseCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition-smooth hover-scale hover:bg-white/20"
      title="Copy response"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Clipboard className="w-4 h-4" />
      )}
    </button>
  );
}

export function MessageBubble({
  message,
  voiceAccent,
}: {
  message: ChatMessage;
  voiceAccent: VoiceAccent;
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, ...(isUser ? { x: 24 } : { x: -24 }) }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
      }}
      className={`flex gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div className="shrink-0 mt-1">
        {isUser ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] text-xs font-semibold text-white shadow-[0_15px_40px_rgba(124,58,237,0.25)]">
            You
          </div>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.2)] border border-white/10 overflow-hidden">
            <img
              src={goldyLogo}
              alt="Goldy"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      <div
        className={`max-w-[90%] md:max-w-[80%] flex flex-col gap-1 ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`relative rounded-[1.75rem] px-5 py-4 shadow-[0_20px_70px_rgba(0,0,0,0.18)] ${
            isUser
              ? "bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] text-white rounded-br-none"
                : "glass-card text-white border border-white/10 rounded-bl-none pr-12 md:pr-28"
          }`}
        >
          {message.content ? (
            isUser ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            ) : (
              <>
                <div className="absolute top-3 right-3 flex items-center gap-2 z-10 rounded-2xl border border-white/10 bg-black/20 p-1.5 backdrop-blur-md">
                  <SpeakButton
                    text={message.content}
                    voiceAccent={voiceAccent}
                  />
                  <FullResponseCopyButton text={message.content} />
                </div>

                <div className="prose prose-invert max-w-none w-full text-sm leading-relaxed prose-headings:font-bold prose-headings:text-foreground prose-headings:mt-4 prose-headings:mb-2 prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:text-foreground prose-p:my-2 prose-p:leading-relaxed prose-strong:text-primary prose-strong:font-bold prose-em:text-muted-foreground prose-li:text-foreground prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2 prose-code:text-primary prose-code:bg-black/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-pre:my-3 prose-pre:overflow-x-auto prose-table:border-collapse prose-table:w-full prose-table:my-3 prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-foreground prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2 prose-td:text-foreground prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-hr:border-border">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      pre({ children, ...props }) {
                        let codeText = "";

                        try {
                          const codeEl = React.Children.only(
                            children,
                          ) as React.ReactElement<{
                            children?: React.ReactNode;
                          }>;

                          codeText =
                            typeof codeEl.props?.children === "string"
                              ? codeEl.props.children
                              : "";
                        } catch {
                          codeText = "";
                        }

                        return (
                          <div className="relative group">
                            <pre {...props}>{children}</pre>
                            {codeText && <CopyButton text={codeText} />}
                          </div>
                        );
                      },

                      a({ href, children }) {
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline hover:opacity-80"
                          >
                            {children}
                          </a>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </>
            )
          ) : (
            <span className="text-muted-foreground italic text-sm">...</span>
          )}
        </div>

        <span className="text-[11px] text-muted-foreground px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}