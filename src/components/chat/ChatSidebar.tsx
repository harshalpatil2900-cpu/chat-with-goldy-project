import { Plus, MessageSquare, Trash2, Sparkles } from "lucide-react";
const goldyLogo = "/goldy-logo.png";
import type { Conversation } from "@/lib/frontend-chat-storage";

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
    <aside className="hidden md:flex flex-col w-72 bg-sidebar border-r border-sidebar-border h-screen">
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl bg-gradient-primary shadow-glow flex items-center justify-center overflow-hidden">
          <img src={goldyLogo} alt="Goldy" width={40} height={40} className="w-10 h-10" />
        </div>
        <div>
          <h1 className="text-lg font-semibold leading-none text-gradient">Goldy</h1>
          <p className="text-xs text-muted-foreground mt-1">AI Chat Assistant</p>
        </div>
      </div>

      <button
        onClick={onNew}
        className="mx-3 mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium text-sm shadow-glow hover:opacity-90 transition"
      >
        <Plus className="w-4 h-4" /> New chat
      </button>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {conversations.length === 0 && (
          <div className="px-3 py-8 text-center text-xs text-muted-foreground">
            <Sparkles className="w-5 h-5 mx-auto mb-2 opacity-50" />
            No chats yet
          </div>
        )}
        {conversations.map((c) => (
          <div
            key={c.id}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition ${
              activeId === c.id
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "hover:bg-sidebar-accent/60 text-muted-foreground"
            }`}
            onClick={() => onSelect(c.id)}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-sm truncate">{c.title}</span>
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

      <div className="p-3 border-t border-sidebar-border text-[11px] text-muted-foreground">
        Powered by Lovable AI · Gemini
      </div>
    </aside>
  );
}