"use client";
import React, { useEffect, useRef, useState } from "react";
import { initDraw, DrawCallbacks, RoomMember, ChatMessage } from "@/draw/initDraw";
import { Users, MessageCircle, Undo2, Redo2 } from "lucide-react";
import Toolbar, { Tool, tools } from "./Toolbar";
import MembersPanel from "./MembersPanel";
import ChatPanel from "./ChatPanel";

const Canvas = ({
  roomId, socket, userName,
}: {
  roomId: string; socket: WebSocket; userName: string;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>("rectangle");
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Panels
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showChat, setShowChat] = useState(false);
  const sendChatRef = useRef<(text: string) => void>(() => {});

  useEffect(() => { setCanvasSize({ width: window.innerWidth, height: window.innerHeight }); }, []);

  // @ts-ignore
  useEffect(() => { window.selectedShape = selectedTool; }, [selectedTool]);

  useEffect(() => {
    const h = () => setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // Keyboard shortcuts for tools
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const found = tools.find(t => t.shortcut?.toLowerCase() === e.key.toLowerCase());
      if (found) setSelectedTool(found.id);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
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

    const start = async () => {
      if (canvasRef.current) {
        cleanupFunc = await initDraw(canvasRef.current, roomId, socket, userName, callbacks);
        sendChatRef.current = callbacks.sendChatMessage;
      }
    };
    start();
    return () => { if (cleanupFunc) cleanupFunc(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef, canvasSize]);

  const barStyle = {
    background: "#232329",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
  };

  return (
    <div className="relative overflow-hidden" style={{ background: "#121212" }}>
      <Toolbar selectedTool={selectedTool} onSelectTool={setSelectedTool} />

      {/* ── Top-right: Members + Chat + Room ─────────────── */}
      <div className="fixed top-3 right-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setShowMembers(!showMembers)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
          style={{ ...barStyle, color: showMembers ? "#7C6FF7" : "rgba(255,255,255,0.5)" }}
        >
          <Users size={14} />
          <span>{members.length}</span>
        </button>
        <button
          onClick={() => setShowChat(!showChat)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
          style={{ ...barStyle, color: showChat ? "#7C6FF7" : "rgba(255,255,255,0.5)" }}
        >
          <MessageCircle size={14} />
          {chatMessages.length > 0 && !showChat && (
            <span className="w-2 h-2 rounded-full bg-[#f43f5e] animate-pulse" />
          )}
        </button>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
          style={{ ...barStyle, color: "rgba(255,255,255,0.5)" }}
        >
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
          Room {roomId}
        </div>
      </div>

      {/* Panels */}
      {showMembers && <MembersPanel members={members} onClose={() => setShowMembers(false)} />}
      {showChat && <ChatPanel messages={chatMessages} onSend={(t) => sendChatRef.current(t)} onClose={() => setShowChat(false)} />}

      {/* ── Undo/Redo ─────────────────────────────────────── */}
      <div className="fixed bottom-4 left-4 z-20">
        <div className="flex items-center gap-0.5 px-1 py-1 rounded-lg" style={barStyle}>
          {[
            { icon: <Undo2 size={16} />, key: "z", label: "Undo — Ctrl+Z" },
            { icon: <Redo2 size={16} />, key: "y", label: "Redo — Ctrl+Y" },
          ].map((btn) => (
            <button
              key={btn.key}
              className="flex items-center justify-center w-8 h-8 rounded-md transition-colors"
              style={{ color: "rgba(255,255,255,0.45)" }}
              title={btn.label}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
              onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: btn.key, ctrlKey: true }))}
            >
              {btn.icon}
            </button>
          ))}
        </div>
      </div>

      {/* ── Canvas ────────────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="touch-none block"
        style={{ cursor: selectedTool === "hand" ? "grab" : selectedTool === "select" ? "default" : "crosshair" }}
      />
    </div>
  );
};

export default Canvas;
