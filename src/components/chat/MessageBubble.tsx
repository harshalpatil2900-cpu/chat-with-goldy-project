import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { motion } from "motion/react";

import type { ChatMessage } from "@/lib/frontend-chat-storage";

const goldyLogo = "/goldy-logo.png";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div className="shrink-0">
        {isUser ? (
          <div className="w-9 h-9 rounded-full bg-[color:var(--user-bubble)] flex items-center justify-center text-sm font-semibold text-foreground">
            You
          </div>
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-primary shadow-glow flex items-center justify-center overflow-hidden">
            <img
              src={goldyLogo}
              alt="Goldy"
              width={36}
              height={36}
              className="w-9 h-9 object-cover"
            />
          </div>
        )}
      </div>

      <div className={`max-w-[78%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-3 rounded-2xl shadow-soft overflow-x-auto ${
            isUser
              ? "bg-[color:var(--user-bubble)] text-foreground rounded-tr-md"
              : "bg-card text-card-foreground rounded-tl-md border border-border"
          }`}
        >
          {message.content ? (
            <div className="prose prose-invert max-w-none text-[15px]
              prose-headings:text-foreground
              prose-p:text-foreground
              prose-strong:text-foreground
              prose-li:text-foreground
              prose-code:text-primary
              prose-pre:bg-black/70
              prose-pre:border
              prose-pre:border-border
              prose-pre:rounded-xl
              prose-table:border
              prose-th:border
              prose-td:border
              prose-th:px-3
              prose-td:px-3
              prose-th:py-2
              prose-td:py-2"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <span className="text-muted-foreground italic text-sm">…</span>
          )}
        </div>

        <span className="text-[11px] text-muted-foreground mt-1 px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}