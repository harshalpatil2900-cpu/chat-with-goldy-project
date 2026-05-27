import { useRef, useState, type KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";

export function ChatInput({
  onSend,
  isStreaming,
  onStop,
}: {
  onSend: (text: string) => void;
  isStreaming: boolean;
  onStop: () => void;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const text = value.trim();
    if (!text || isStreaming) return;
    onSend(text);
    setValue("");
    if (ref.current) ref.current.style.height = "auto";
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur-md p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 bg-card border border-border rounded-2xl p-2 shadow-soft focus-within:border-primary/60 transition">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
            }}
            onKeyDown={onKeyDown}
            placeholder="Ask Goldy anything…"
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none px-3 py-2 text-[15px] placeholder:text-muted-foreground"
          />
          {isStreaming ? (
            <button
              onClick={onStop}
              className="w-10 h-10 rounded-xl bg-destructive text-destructive-foreground flex items-center justify-center hover:opacity-90 transition"
              aria-label="Stop"
            >
              <Square className="w-4 h-4" fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!value.trim()}
              className="w-10 h-10 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center shadow-glow hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-2">
          Goldy can make mistakes. Press Enter to send, Shift+Enter for newline.
        </p>
      </div>
    </div>
  );
}