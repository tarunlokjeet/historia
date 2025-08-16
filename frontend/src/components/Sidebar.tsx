"use client";
import { useState } from "react";
import { MessageSquare, Plus, Sparkles } from "lucide-react";

interface ChatHistoryItem {
  id: string;
  title: string;
}

interface SidebarProps {
  history?: ChatHistoryItem[];
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
}

export default function Sidebar({ history = [], onNewChat, onSelectChat }: SidebarProps) {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setActiveChatId(id);
    onSelectChat(id);
  };

  return (
    <aside className="h-full w-64 bg-gradient-to-b from-[#0a0a0a] to-[#000000] text-white flex flex-col border-r border-gray-800/70 shadow-2xl">
      {/* App Logo + New Chat Button */}
      <div className="p-4 border-b border-gray-800/40 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-emerald-400" size={20} />
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Historia
          </h1>
        </div>
        <button
          onClick={onNewChat}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 rounded-lg text-white font-medium text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95"
          title="New Chat"
        >
          <Plus size={16} className="transition-transform duration-200 group-hover:rotate-90" />
          New Chat
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
        {(!history || history.length === 0) && (
          <div className="text-center mt-8 px-4">
            <MessageSquare className="mx-auto text-gray-600 mb-3" size={32} />
            <p className="text-sm text-gray-500">No conversations yet</p>
            <p className="text-xs text-gray-600 mt-1">Start a new chat to begin</p>
          </div>
        )}
        {history.map((chat) => (
          <button
            key={chat.id}
            onClick={() => handleSelect(chat.id)}
            className={`group flex items-center w-full text-left text-sm px-3 py-3 rounded-xl transition-all duration-200 relative overflow-hidden ${
              chat.id === activeChatId
                ? "bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 border-l-2 border-emerald-400 shadow-lg shadow-emerald-500/5"
                : "hover:bg-white/3 hover:shadow-md hover:scale-[1.02]"
            }`}
          >
            <MessageSquare
              className={`mr-3 transition-colors duration-200 ${
                chat.id === activeChatId
                  ? "text-emerald-400"
                  : "text-gray-600 group-hover:text-gray-400"
              }`}
              size={16}
            />
            <span
              className={`truncate transition-colors duration-200 ${
                chat.id === activeChatId
                  ? "text-white font-medium"
                  : "text-gray-400 group-hover:text-gray-200"
              }`}
            >
              {chat.title}
            </span>
            {chat.id === activeChatId && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}

