"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { initDraw, DrawCallbacks, RoomMember, ChatMessage } from "@/draw/initDraw";
import {
  Square, Circle, PenLine, Minus, Diamond, Hand,
  MousePointer2, Undo2, Redo2, Users, MessageCircle,
  Send, X, ChevronDown,
} from "lucide-react";

type Tool = "select" | "hand" | "rectangle" | "diamond" | "circle" | "line" | "pen";

interface ToolDef {
  id: Tool;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

const tools: ToolDef[] = [
  { id: "select",    icon: <MousePointer2 size={18} />, label: "Select",    shortcut: "V" },
  { id: "hand",      icon: <Hand size={18} />,          label: "Hand",      shortcut: "H" },
  { id: "rectangle", icon: <Square size={18} />,        label: "Rectangle", shortcut: "R" },
  { id: "diamond",   icon: <Diamond size={18} />,       label: "Diamond",   shortcut: "D" },
  { id: "circle",    icon: <Circle size={18} />,        label: "Circle",    shortcut: "O" },
  { id: "line",      icon: <Minus size={18} />,         label: "Line",      shortcut: "L" },
  { id: "pen",       icon: <PenLine size={18} />,       label: "Pen",       shortcut: "P" },
];

const Canvas = ({
  roomId, socket, userName,
}: {
  roomId: string; socket: WebSocket; userName: string;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>("rectangle");
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Members & Chat state
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const sendChatRef = useRef<(text: string) => void>(() => {});
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  useEffect(() => {
    // @ts-ignore
    window.selectedShape = selectedTool;
  }, [selectedTool]);

  useEffect(() => {
    const handleResize = () => setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keyboard shortcuts for tools (only when chat is closed)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const found = tools.find(t => t.shortcut?.toLowerCase() === e.key.toLowerCase());
      if (found) setSelectedTool(found.id);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Init drawing engine
  useEffect(() => {
    if (!canvasRef.current || canvasSize.width === 0) return;
    let cleanupFunc: (() => void) | undefined;

    const callbacks: DrawCallbacks = {
      onMembersUpdate: (m) => setMembers([...m]),
      onChatMessage: (msg) => setChatMessages(prev => [...prev, msg]),
      sendChatMessage: () => {},
    };

    const startDrawing = async () => {
      if (canvasRef.current) {
        cleanupFunc = await initDraw(canvasRef.current, roomId, socket, userName, callbacks);
        sendChatRef.current = callbacks.sendChatMessage;
      }
    };
    startDrawing();

    return () => { if (cleanupFunc) cleanupFunc(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef, canvasSize]);

  const handleSendChat = useCallback(() => {
    if (chatInput.trim()) {
      sendChatRef.current(chatInput);
      setChatInput("");
    }
  }, [chatInput]);

  const panelStyle = {
    background: "#1E1E24",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  };

  const toolbarStyle = {
    background: "#232329",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
  };

  return (
    <div className="relative overflow-hidden" style={{ background: "#121212" }}>
      {/* ── Floating Toolbar ────────────────────────────────── */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-0.5 px-1.5 py-1.5 rounded-xl shadow-2xl" style={toolbarStyle}>
          {tools.map((tool, i) => (
            <React.Fragment key={tool.id}>
              {i === 2 && <div className="w-px h-6 mx-0.5" style={{ background: "rgba(255,255,255,0.1)" }} />}
              <button
                onClick={() => setSelectedTool(tool.id)}
                title={`${tool.label}${tool.shortcut ? ` — ${tool.shortcut}` : ""}`}
                className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150"
                style={{
                  background: selectedTool === tool.id ? "rgba(115,103,240,0.25)" : "transparent",
                  color: selectedTool === tool.id ? "#7C6FF7" : "rgba(255,255,255,0.55)",
                }}
                onMouseEnter={(e) => {
                  if (selectedTool !== tool.id) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedTool !== tool.id) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                  }
                }}
              >
                {tool.icon}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Top-right: Room + Members + Chat toggles ─────── */}
      <div className="fixed top-3 right-4 z-20 flex items-center gap-2">
        {/* Members toggle */}
        <button
          onClick={() => setShowMembers(!showMembers)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
          style={{
            ...toolbarStyle,
            color: showMembers ? "#7C6FF7" : "rgba(255,255,255,0.5)",
          }}
        >
          <Users size={14} />
          <span>{members.length}</span>
        </button>

        {/* Chat toggle */}
        <button
          onClick={() => setShowChat(!showChat)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
          style={{
            ...toolbarStyle,
            color: showChat ? "#7C6FF7" : "rgba(255,255,255,0.5)",
          }}
        >
          <MessageCircle size={14} />
          {chatMessages.length > 0 && !showChat && (
            <span className="w-2 h-2 rounded-full bg-[#f43f5e] animate-pulse" />
          )}
        </button>

        {/* Room indicator */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
          style={{ ...toolbarStyle, color: "rgba(255,255,255,0.5)" }}
        >
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
          Room {roomId}
        </div>
      </div>

      {/* ── Members Panel ─────────────────────────────────── */}
      {showMembers && (
        <div className="fixed top-14 right-4 z-30 w-56 rounded-xl overflow-hidden" style={panelStyle}>
          <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
              Members ({members.length})
            </span>
            <button onClick={() => setShowMembers(false)}>
              <X size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {members.map((m) => (
              <div key={m.sessionUserId} className="flex items-center gap-2.5 px-3 py-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: m.color }} />
                <span className="text-xs truncate" style={{ color: "rgba(255,255,255,0.75)" }}>
                  {m.username}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Chat Panel ────────────────────────────────────── */}
      {showChat && (
        <div
          className="fixed bottom-4 right-4 z-30 w-72 rounded-xl overflow-hidden flex flex-col"
          style={{ ...panelStyle, maxHeight: "360px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
              Chat
            </span>
            <button onClick={() => setShowChat(false)}>
              <X size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2.5" style={{ minHeight: "180px" }}>
            {chatMessages.length === 0 && (
              <p className="text-center text-xs py-8" style={{ color: "rgba(255,255,255,0.2)" }}>
                No messages yet
              </p>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="text-[10px] font-medium" style={{ color: msg.color }}>
                  {msg.username}
                </span>
                <div
                  className="text-xs px-2.5 py-1.5 rounded-lg inline-block max-w-full break-words"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSendChat(); }}
              placeholder="Type a message..."
              className="flex-1 text-xs px-2.5 py-1.5 rounded-lg outline-none"
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
            <button
              onClick={handleSendChat}
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
              style={{ background: chatInput.trim() ? "#7C6FF7" : "rgba(255,255,255,0.05)", color: "#fff" }}
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ── Undo/Redo ─────────────────────────────────────── */}
      <div className="fixed bottom-4 left-4 z-20">
        <div className="flex items-center gap-0.5 px-1 py-1 rounded-lg" style={toolbarStyle}>
          <button
            className="flex items-center justify-center w-8 h-8 rounded-md transition-colors"
            style={{ color: "rgba(255,255,255,0.45)" }}
            title="Undo — Ctrl+Z"
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
            onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true }))}
          >
            <Undo2 size={16} />
          </button>
          <button
            className="flex items-center justify-center w-8 h-8 rounded-md transition-colors"
            style={{ color: "rgba(255,255,255,0.45)" }}
            title="Redo — Ctrl+Y"
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
            onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "y", ctrlKey: true }))}
          >
            <Redo2 size={16} />
          </button>
        </div>
      </div>

      {/* ── Canvas ────────────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="touch-none block"
        style={{
          cursor: selectedTool === "hand" ? "grab"
            : selectedTool === "select" ? "default"
            : "crosshair",
        }}
      />
    </div>
  );
};

export default Canvas;
