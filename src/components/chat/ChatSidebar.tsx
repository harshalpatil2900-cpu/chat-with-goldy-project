import { Plus, MessageSquare, Trash2, Sparkles } from "lucide-react";
import type { Conversation } from "@/lib/frontend-chat-storage";

const goldyLogo = "/goldy-logo.png";

export function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <aside className="hidden md:flex flex-col w-72 bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border h-screen">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-11 h-11 rounded-2xl bg-gradient-primary shadow-xl flex items-center justify-center overflow-hidden ring-2 ring-primary/30">
          <img
            src={goldyLogo}
            alt="Goldy"
            width={44}
            height={44}
            className="w-11 h-11 object-cover"
          />
        </div>

        <div>
          <h1
            className="text-xl font-bold tracking-wide text-primary"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Goldy AI
          </h1>

          <p
            className="text-xs text-muted-foreground mt-1 font-medium tracking-wide"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Advanced Assistant
          </p>
        </div>
      </div>

      {/* New Chat Button */}
      <button
        onClick={onNew}
        className="mx-3 mt-4 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-primary text-primary-foreground font-semibold text-sm shadow-lg hover:scale-[1.02] hover:opacity-90 transition-all duration-300"
      >
        <Plus className="w-4 h-4" />
        New Chat
      </button>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-2">
        {conversations.length === 0 && (
          <div className="px-3 py-10 text-center text-xs text-muted-foreground">
            <Sparkles className="w-6 h-6 mx-auto mb-3 opacity-60" />
            No chats yet
          </div>
        )}

        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
              activeId === c.id
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md"
                : "hover:bg-sidebar-accent/60 text-muted-foreground"
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />

            <span className="flex-1 text-sm truncate font-medium">
              {c.title}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(c.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
              aria-label="Delete chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div
          className="text-[11px] text-muted-foreground text-center"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Powered by Gemini AI ⚡
        </div>
      </div>
    </aside>
  );
}