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
    <div className="glass-panel border-t border-white/10 p-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-3">
        <div className="glass-card flex flex-col gap-3 rounded-[2rem] p-4 transition-smooth focus-glow focus-within:border-[#7C3AED]/40">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height =
                Math.min(e.target.scrollHeight, 220) + "px";
            }}
            onKeyDown={onKeyDown}
            placeholder={isListening ? "Listening..." : "Ask Goldy anything…"}
            rows={1}
            className="min-h-[3.5rem] w-full resize-none rounded-3xl bg-transparent px-4 py-3 text-base text-foreground outline-none placeholder:text-muted focus-glow"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="inline-flex h-9 items-center rounded-full border border-white/10 bg-white/5 px-3">
                Enter to send
              </span>
              <span className="inline-flex h-9 items-center rounded-full border border-white/10 bg-white/5 px-3">
                Shift + Enter for newline
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={isListening ? stopVoiceInput : startVoiceInput}
                disabled={isStreaming}
                className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 transition-smooth hover-scale ${
                  isListening
                    ? "bg-rose-500 text-white animate-pulse-glow"
                    : "bg-white/5 text-white hover:bg-white/10 btn-glow"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                aria-label="Voice input"
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              {isStreaming ? (
                <button
                  onClick={onStop}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-[#0B0F19] transition-smooth hover-scale btn-glow"
                  aria-label="Stop"
                >
                  <Square className="w-4 h-4" fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={!value.trim()}
                  className="inline-flex h-11 min-w-[3rem] items-center justify-center rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-4 text-white shadow-[0_18px_50px_rgba(124,58,237,0.24)] transition-smooth hover-scale btn-glow disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Send"
                >
                  <Send className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-500">
          Goldy responds instantly with code, study help, and intelligent prompts. Use the mic to dictate or type your question directly.
        </p>
      </div>
    </div>
  );
}