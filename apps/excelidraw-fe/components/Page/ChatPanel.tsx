"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Send } from "lucide-react";
import { ChatMessage } from "@repo/common/types";

export default function ChatPanel({
  messages,
  onSend,
  onClose,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  }, [input, onSend]);

  return (
    <div
      className="fixed bottom-4 right-4 z-30 w-72 rounded-xl overflow-hidden flex flex-col"
      style={{
        background: "#1E1E24",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        maxHeight: "360px",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>Chat</span>
        <button onClick={onClose}>
          <X size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2.5" style={{ minHeight: "180px" }}>
        {messages.length === 0 && (
          <p className="text-center text-xs py-8" style={{ color: "rgba(255,255,255,0.2)" }}>
            No messages yet
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            <span className="text-[10px] font-medium" style={{ color: msg.color }}>{msg.username}</span>
            <div
              className="text-xs px-2.5 py-1.5 rounded-lg inline-block max-w-full break-words"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.8)" }}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          placeholder="Type a message..."
          className="flex-1 text-xs px-2.5 py-1.5 rounded-lg outline-none"
          style={{
            background: "rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.8)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
        <button
          onClick={handleSend}
          className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
          style={{ background: input.trim() ? "#7C6FF7" : "rgba(255,255,255,0.05)", color: "#fff" }}
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}
