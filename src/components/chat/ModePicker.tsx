import { Sparkles, Code2, GraduationCap } from "lucide-react";
import type { Mode } from "@/lib/frontend-chat-storage";

const MODES: { id: Mode; label: string; icon: typeof Sparkles }[] = [
  { id: "general", label: "General", icon: Sparkles },
  { id: "coding", label: "Coding Mentor", icon: Code2 },
  { id: "study", label: "Study Booster", icon: GraduationCap },
];

export function ModePicker({
  value,
  onChange,
  disabled,
}: {
  value: Mode;
  onChange: (m: Mode) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex p-1 rounded-xl bg-card border border-border shadow-soft">
      {MODES.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            disabled={disabled}
            onClick={() => onChange(id)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition ${
              active
                ? "bg-gradient-primary text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:text-foreground"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}