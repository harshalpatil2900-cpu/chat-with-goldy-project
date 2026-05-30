import { useState } from "react";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { motion } from "motion/react";
import { Copy, Check, Clipboard } from "lucide-react";

import type { ChatMessage } from "@/lib/frontend-chat-storage";

const goldyLogo = "/goldy-logo.png";

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
      className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
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
      className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-border bg-background/80 hover:bg-accent transition"
      title="Copy response"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-green-500" />
          Copied
        </>
      ) : (
        <>
          <Clipboard className="w-3 h-3" />
          Copy
        </>
      )}
    </button>
  );
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div className="shrink-0 mt-1">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shadow-md">
            You
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full shadow-md overflow-hidden border border-border">
            <img
              src={goldyLogo}
              alt="Goldy"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      <div
        className={`max-w-[80%] flex flex-col gap-1 ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`relative px-4 py-3 rounded-2xl shadow-sm ${
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-card text-card-foreground rounded-tl-sm border border-border pr-16"
          }`}
        >
          {message.content ? (
            isUser ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            ) : (
              <>
                <FullResponseCopyButton text={message.content} />

                <div className="prose prose-invert max-w-none text-sm leading-relaxed prose-headings:font-bold prose-headings:text-foreground prose-headings:mt-4 prose-headings:mb-2 prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:text-foreground prose-p:my-2 prose-p:leading-relaxed prose-strong:text-primary prose-strong:font-bold prose-em:text-muted-foreground prose-li:text-foreground prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2 prose-code:text-primary prose-code:bg-black/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-pre:my-3 prose-pre:overflow-x-auto prose-table:border-collapse prose-table:w-full prose-table:my-3 prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-foreground prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2 prose-td:text-foreground prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-hr:border-border">
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