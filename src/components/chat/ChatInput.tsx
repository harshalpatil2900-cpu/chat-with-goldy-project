import { useRef, useState, type KeyboardEvent } from "react";
import { Send, Square, Mic, MicOff } from "lucide-react";

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

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
  const [isListening, setIsListening] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const submit = () => {
    const text = value.trim();
    if (!text || isStreaming) return;

    onSend(text);
    setValue("");

    if (ref.current) {
      ref.current.style.height = "auto";
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      setValue(transcript);

      setTimeout(() => {
        if (ref.current) {
          ref.current.style.height = "auto";
          ref.current.style.height =
            Math.min(ref.current.scrollHeight, 200) + "px";
        }
      }, 0);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
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
              e.target.style.height =
                Math.min(e.target.scrollHeight, 200) + "px";
            }}
            onKeyDown={onKeyDown}
            placeholder={
              isListening ? "Listening..." : "Ask Goldy anything…"
            }
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none px-3 py-2 text-[15px] placeholder:text-muted-foreground"
          />

          <button
            onClick={isListening ? stopVoiceInput : startVoiceInput}
            disabled={isStreaming}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
              isListening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-muted text-foreground hover:bg-accent"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            aria-label="Voice input"
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

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
          Click mic to speak.
        </p>
      </div>
    </div>
  );
}