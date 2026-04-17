import axios from "axios";
import { HTTP_BACKEND } from "@/lib/config";
import { Shape, RemoteCursor, RoomMember, ChatMessage, DrawCallbacks } from "@repo/common/types";
import { drawShape, drawSelectionBox, drawInProgressShape, drawRemoteCursor } from "./drawHelpers";
import { hitTest, moveShape } from "./hitTest";

// Re-export types for Canvas component
export type { RoomMember, ChatMessage, DrawCallbacks } from "@repo/common/types";

// ── Utilities ──────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function throttle<T extends (...args: any[]) => void>(func: T, limit: number): T {
  let inThrottle = false;
  return function(this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  } as T;
}

// ── Session identity (unique per browser tab) ──────────────────
const sessionUserId = Math.random().toString(36).substring(2, 15);
const cursorColors = ["#7C6FF7","#f43f5e","#3b82f6","#10b981","#f59e0b","#ec4899","#06b6d4","#84cc16","#6366f1","#14b8a6"];
const sessionColor = cursorColors[Math.floor(Math.random() * cursorColors.length)]!;

// ── Shared state (lives outside the function so it persists) ───
const remotePreviews: Map<string, Shape> = new Map();
const remoteCursors: Map<string, RemoteCursor> = new Map();

// ── Render everything ──────────────────────────────────────────
function renderAll(
  shapes: Shape[], ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement,
  panX: number, panY: number, selectedIdx: number
) {
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#121212";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dot grid (moves with pan)
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  const sp = 24;
  for (let gx = ((panX % sp) + sp) % sp; gx < canvas.width; gx += sp)
    for (let gy = ((panY % sp) + sp) % sp; gy < canvas.height; gy += sp)
      ctx.fillRect(gx - 0.5, gy - 0.5, 1, 1);

  ctx.translate(panX, panY);
  shapes.forEach((s, i) => {
    drawShape(s, ctx, "rgba(255,255,255,0.85)", "rgba(255,255,255,0.06)");
    if (i === selectedIdx) drawSelectionBox(s, ctx);
  });
  remotePreviews.forEach(s => drawInProgressShape(s, ctx));
  remoteCursors.forEach(c => drawRemoteCursor(c, ctx));
  ctx.restore();
}

// ── Fetch saved shapes from DB ─────────────────────────────────
async function getExistingShapes(roomId: string): Promise<Shape[]> {
  const res = await axios.get(`${HTTP_BACKEND}/user/chats/${roomId}`);
  return res.data.messages.map((x: { message: string }) => JSON.parse(x.message).shape);
}

// ── Main entry point ───────────────────────────────────────────
export async function initDraw(
  canvas: HTMLCanvasElement, roomId: string, socket: WebSocket,
  userName = "Anonymous", callbacks?: DrawCallbacks
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const shapes: Shape[] = await getExistingShapes(roomId);
  let redoStack: Shape[] = [];
  const name = userName || "Anonymous";

  let panX = 0, panY = 0, selectedIdx = -1;
  const toWorld = (sx: number, sy: number) => ({ x: sx - panX, y: sy - panY });

  // ── Members tracking ──────────────────────────────────────
  const members = new Map<string, RoomMember>();
  members.set(sessionUserId, { sessionUserId, username: name, color: sessionColor });
  callbacks?.onMembersUpdate(Array.from(members.values()));

  // ── Throttled senders ─────────────────────────────────────
  const sendPreview = throttle((s: Shape) => {
    if (socket.readyState === WebSocket.OPEN)
      socket.send(JSON.stringify({ type: "draw_preview", roomId, shape: s, sessionUserId }));
  }, 30);

  const sendCursor = throttle((x: number, y: number) => {
    if (socket.readyState === WebSocket.OPEN)
      socket.send(JSON.stringify({ type: "cursor_move", roomId, sessionUserId, x, y, username: name, color: sessionColor }));
  }, 50);

  // ── Chat sender ───────────────────────────────────────────
  if (callbacks) {
    callbacks.sendChatMessage = (text: string) => {
      if (socket.readyState === WebSocket.OPEN && text.trim()) {
        const msg: ChatMessage = { sessionUserId, username: name, color: sessionColor, text: text.trim(), timestamp: Date.now() };
        socket.send(JSON.stringify({ type: "text_chat", roomId, ...msg }));
        callbacks.onChatMessage(msg);
      }
    };
  }

  // Announce join
  if (socket.readyState === WebSocket.OPEN)
    socket.send(JSON.stringify({ type: "user_joined", roomId, sessionUserId, username: name, color: sessionColor }));

  // Stale cursor cleanup
  const cleanup = setInterval(() => {
    let changed = false;
    const now = Date.now();
    remoteCursors.forEach((c, id) => { if (now - c.lastUpdate > 5000) { remoteCursors.delete(id); changed = true; } });
    if (changed) renderAll(shapes, ctx, canvas, panX, panY, selectedIdx);
  }, 2000);

  const render = () => renderAll(shapes, ctx, canvas, panX, panY, selectedIdx);

  // ── WebSocket handler ─────────────────────────────────────
  socket.onmessage = (event) => {
    const d = JSON.parse(event.data);

    if (d.type === "chat") {
      const parsed = JSON.parse(d.message);
      if (!parsed.shape) return;
      if (d.userId) remotePreviews.delete(d.userId);
      if (d.sessionUserId) remotePreviews.delete(d.sessionUserId);
      shapes.push(parsed.shape);
      render();
    }
    if (d.type === "draw_preview") {
      const sid = d.sessionUserId || d.userId;
      if (sid === sessionUserId) return;
      d.shape ? remotePreviews.set(sid, d.shape) : remotePreviews.delete(sid);
      render();
    }
    if (d.type === "cursor_move") {
      if (d.sessionUserId === sessionUserId) return;
      remoteCursors.set(d.sessionUserId, { x: d.x, y: d.y, username: d.username, color: d.color, lastUpdate: Date.now() });
      render();
    }
    if (d.type === "shape_move") {
      if (d.sessionUserId === sessionUserId) return;
      if (d.shapeIndex >= 0 && d.shapeIndex < shapes.length) {
        moveShape(shapes[d.shapeIndex]!, d.dx, d.dy);
        render();
      }
    }
    if (d.type === "user_joined") {
      if (d.sessionUserId === sessionUserId) return;
      members.set(d.sessionUserId, { sessionUserId: d.sessionUserId, username: d.username, color: d.color });
      callbacks?.onMembersUpdate(Array.from(members.values()));
      if (socket.readyState === WebSocket.OPEN)
        socket.send(JSON.stringify({ type: "user_presence", roomId, sessionUserId, username: name, color: sessionColor }));
    }
    if (d.type === "user_presence") {
      if (d.sessionUserId === sessionUserId) return;
      members.set(d.sessionUserId, { sessionUserId: d.sessionUserId, username: d.username, color: d.color });
      callbacks?.onMembersUpdate(Array.from(members.values()));
    }
    if (d.type === "user_left") {
      remoteCursors.delete(d.sessionUserId);
      remotePreviews.delete(d.sessionUserId);
      members.delete(d.sessionUserId);
      callbacks?.onMembersUpdate(Array.from(members.values()));
      render();
    }
    if (d.type === "text_chat") {
      if (d.sessionUserId === sessionUserId) return;
      callbacks?.onChatMessage({ sessionUserId: d.sessionUserId, username: d.username, color: d.color, text: d.text, timestamp: d.timestamp });
    }
  };

  render();

  // ── Mouse state ───────────────────────────────────────────
  let clicked = false, startX = 0, startY = 0;
  let currentPoints: { x: number; y: number }[] = [];
  let isDragging = false, isPanning = false;
  let dragLastX = 0, dragLastY = 0;

  const undo = () => { const s = shapes.pop(); if (s) { redoStack.push(s); selectedIdx = -1; render(); } };
  const redo = () => { const s = redoStack.pop(); if (s) { shapes.push(s); render(); } };

  const handleKeyDown = (e: KeyboardEvent) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && (e.key === "z" || e.key === "Z")) { e.preventDefault(); undo(); }
    if (ctrl && (e.key === "y" || e.key === "Y")) { e.preventDefault(); redo(); }
    if ((e.key === "Delete" || e.key === "Backspace") && selectedIdx >= 0) {
      shapes.splice(selectedIdx, 1); selectedIdx = -1; render();
    }
    if (e.key === "Escape") { selectedIdx = -1; render(); }
  };

  const handleMouseDown = (e: MouseEvent) => {
    clicked = true; startX = e.clientX; startY = e.clientY;
    dragLastX = e.clientX; dragLastY = e.clientY;
    // @ts-ignore
    const tool = window.selectedShape;

    if (tool === "hand") { isPanning = true; return; }
    if (tool === "select") {
      const w = toWorld(e.clientX, e.clientY);
      let found = -1;
      for (let i = shapes.length - 1; i >= 0; i--) { if (hitTest(shapes[i]!, w.x, w.y)) { found = i; break; } }
      selectedIdx = found; isDragging = found >= 0; render(); return;
    }
    selectedIdx = -1;
    if (tool === "pen") { const w = toWorld(startX, startY); currentPoints = [{ x: w.x, y: w.y }]; }
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (isPanning) { isPanning = false; clicked = false; return; }
    if (isDragging) { isDragging = false; clicked = false; return; }
    clicked = false;
    // @ts-ignore
    const tool = window.selectedShape;
    if (tool === "select" || tool === "hand") return;

    const w = toWorld(e.clientX, e.clientY), ws = toWorld(startX, startY);
    const width = w.x - ws.x, height = w.y - ws.y;
    let shape: Shape | null = null;

    if (tool === "rectangle") shape = { type: "rectangle", x: ws.x, y: ws.y, width, height };
    else if (tool === "circle") { const r = Math.max(Math.abs(width), Math.abs(height)) / 2; shape = { type: "circle", centerX: ws.x + width / 2, centerY: ws.y + height / 2, radius: r }; }
    else if (tool === "pen") { shape = { type: "pen", points: currentPoints }; currentPoints = []; }
    else if (tool === "line") shape = { type: "line", x1: ws.x, y1: ws.y, x2: w.x, y2: w.y };
    else if (tool === "diamond") shape = { type: "diamond", centerX: ws.x + width / 2, centerY: ws.y + height / 2, halfWidth: Math.abs(width) / 2, halfHeight: Math.abs(height) / 2 };

    if (!shape) return;
    shapes.push(shape);
    if (socket.readyState === WebSocket.OPEN)
      socket.send(JSON.stringify({ type: "chat", roomId, message: JSON.stringify({ shape }), sessionUserId }));
    redoStack = []; render();
  };

  const handleMouseMove = (e: MouseEvent) => {
    sendCursor(...Object.values(toWorld(e.clientX, e.clientY)) as [number, number]);

    if (isPanning && clicked) {
      panX += e.clientX - dragLastX; panY += e.clientY - dragLastY;
      dragLastX = e.clientX; dragLastY = e.clientY; render(); return;
    }
    if (isDragging && clicked && selectedIdx >= 0) {
      const dx = e.clientX - dragLastX, dy = e.clientY - dragLastY;
      moveShape(shapes[selectedIdx]!, dx, dy);
      dragLastX = e.clientX; dragLastY = e.clientY;
      if (socket.readyState === WebSocket.OPEN)
        socket.send(JSON.stringify({ type: "shape_move", roomId, sessionUserId, shapeIndex: selectedIdx, dx, dy }));
      render(); return;
    }
    if (clicked) {
      // @ts-ignore
      const tool = window.selectedShape;
      const wp = toWorld(e.clientX, e.clientY), ws = toWorld(startX, startY);
      const w = wp.x - ws.x, h = wp.y - ws.y;
      let preview: Shape | null = null;

      if (tool === "pen") { currentPoints.push({ x: wp.x, y: wp.y }); preview = { type: "pen", points: [...currentPoints] }; }
      else if (tool === "rectangle") preview = { type: "rectangle", x: ws.x, y: ws.y, width: w, height: h };
      else if (tool === "circle") { const r = Math.max(Math.abs(w), Math.abs(h)) / 2; preview = { type: "circle", centerX: ws.x + w / 2, centerY: ws.y + h / 2, radius: r }; }
      else if (tool === "line") preview = { type: "line", x1: ws.x, y1: ws.y, x2: wp.x, y2: wp.y };
      else if (tool === "diamond") preview = { type: "diamond", centerX: ws.x + w / 2, centerY: ws.y + h / 2, halfWidth: Math.abs(w) / 2, halfHeight: Math.abs(h) / 2 };

      render();
      if (preview) {
        ctx.save(); ctx.translate(panX, panY);
        drawShape(preview, ctx, "rgba(255,255,255,0.85)", "rgba(255,255,255,0.06)");
        ctx.restore(); sendPreview(preview);
      }
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("mousemove", handleMouseMove);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
    canvas.removeEventListener("mousedown", handleMouseDown);
    canvas.removeEventListener("mouseup", handleMouseUp);
    canvas.removeEventListener("mousemove", handleMouseMove);
    clearInterval(cleanup);
    if (socket.readyState === WebSocket.OPEN)
      socket.send(JSON.stringify({ type: "user_left", roomId, sessionUserId }));
  };
}
