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
    <aside className="hidden md:flex h-screen w-80 flex-col glass-panel border-r border-white/10">
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/10 shadow-lg">
          <img
            src={goldyLogo}
            alt="Goldy"
            width={44}
            height={44}
            className="h-11 w-11 rounded-2xl object-cover"
          />
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400">
            AI Assistant
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Goldy AI
          </h2>
        </div>
      </div>

      <button
        onClick={onNew}
        className="mx-6 mt-5 flex items-center justify-center gap-2 rounded-[1.5rem] bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-4 py-3 text-sm font-semibold text-white shadow-[0_20px_60px_rgba(124,58,237,0.16)] hover-scale btn-glow"
      >
        <Plus className="w-4 h-4" />
        New Chat
      </button>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
        {conversations.length === 0 ? (
          <div className="glass-card rounded-[1.75rem] p-5 text-center text-sm text-muted">
            <Sparkles className="mx-auto mb-3 h-7 w-7 text-muted opacity-70" />
            <div className="font-medium text-foreground">No chats yet</div>
            <p className="mt-2 text-[13px] text-muted">
              Start a new chat to build your first Goldy conversation.
            </p>
          </div>
        ) : (
          conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`group flex cursor-pointer items-center gap-3 rounded-[1.5rem] border px-4 py-4 transition-smooth card-hover ${
                activeId === c.id
                  ? "border-[#7C3AED]/40 bg-[#7C3AED]/10 text-white shadow-[0_20px_60px_rgba(124,58,237,0.14)]"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-[#06B6D4]/30 hover:bg-[#06B6D4]/10 hover:text-white"
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="flex-1 overflow-hidden text-sm font-medium leading-tight text-ellipsis whitespace-nowrap">
                {c.title}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                className="opacity-0 transition-smooth group-hover:opacity-100 text-slate-400 hover:text-amber-400"
                aria-label="Delete chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-white/10 px-6 py-4 text-center text-[11px] text-slate-500">
        Powered by Harshal Patil
      </div>
    </aside>
  );
}
