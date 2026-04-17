import axios from "axios";
import { HTTP_BACKEND } from "@/lib/config";

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

// ── Session identity ───────────────────────────────────────────
const sessionUserId = Math.random().toString(36).substring(2, 15);
const cursorColors = [
  "#7C6FF7", "#f43f5e", "#3b82f6", "#10b981", "#f59e0b",
  "#ec4899", "#06b6d4", "#84cc16", "#6366f1", "#14b8a6"
];
const sessionColor = cursorColors[Math.floor(Math.random() * cursorColors.length)]!;

// ── Types ──────────────────────────────────────────────────────
interface RemoteCursor {
  x: number;
  y: number;
  username: string;
  color: string;
  lastUpdate: number;
}

export interface RoomMember {
  sessionUserId: string;
  username: string;
  color: string;
}

export interface ChatMessage {
  sessionUserId: string;
  username: string;
  color: string;
  text: string;
  timestamp: number;
}

type Shape =
  | { type: "rectangle"; x: number; y: number; height: number; width: number; }
  | { type: "circle"; centerX: number; centerY: number; radius: number; }
  | { type: "pen"; points: { x: number; y: number }[]; }
  | { type: "line"; x1: number; y1: number; x2: number; y2: number; }
  | { type: "diamond"; centerX: number; centerY: number; halfWidth: number; halfHeight: number; };

// ── Hit testing ────────────────────────────────────────────────
function hitTest(shape: Shape, px: number, py: number): boolean {
  if (shape.type === "rectangle") {
    const { x, y, width, height } = shape;
    const minX = Math.min(x, x + width);
    const maxX = Math.max(x, x + width);
    const minY = Math.min(y, y + height);
    const maxY = Math.max(y, y + height);
    return px >= minX && px <= maxX && py >= minY && py <= maxY;
  }
  if (shape.type === "circle") {
    const dx = px - shape.centerX;
    const dy = py - shape.centerY;
    return Math.sqrt(dx * dx + dy * dy) <= Math.abs(shape.radius) + 5;
  }
  if (shape.type === "diamond") {
    const { centerX, centerY, halfWidth, halfHeight } = shape;
    const dx = Math.abs(px - centerX) / halfWidth;
    const dy = Math.abs(py - centerY) / halfHeight;
    return dx + dy <= 1.1;
  }
  if (shape.type === "line") {
    const { x1, y1, x2, y2 } = shape;
    const d = distPointToLine(px, py, x1, y1, x2, y2);
    return d <= 8;
  }
  if (shape.type === "pen") {
    for (let i = 1; i < shape.points.length; i++) {
      const p1 = shape.points[i - 1]!;
      const p2 = shape.points[i]!;
      if (distPointToLine(px, py, p1.x, p1.y, p2.x, p2.y) <= 8) return true;
    }
    return false;
  }
  return false;
}

function distPointToLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let t = lenSq !== 0 ? dot / lenSq : -1;
  t = Math.max(0, Math.min(1, t));
  const xx = x1 + t * C;
  const yy = y1 + t * D;
  return Math.sqrt((px - xx) * (px - xx) + (py - yy) * (py - yy));
}

// ── Move shape by dx,dy ───────────────────────────────────────
function moveShape(shape: Shape, dx: number, dy: number) {
  if (shape.type === "rectangle") { shape.x += dx; shape.y += dy; }
  if (shape.type === "circle") { shape.centerX += dx; shape.centerY += dy; }
  if (shape.type === "diamond") { shape.centerX += dx; shape.centerY += dy; }
  if (shape.type === "line") { shape.x1 += dx; shape.y1 += dy; shape.x2 += dx; shape.y2 += dy; }
  if (shape.type === "pen") { shape.points.forEach(p => { p.x += dx; p.y += dy; }); }
}

// ── Drawing helpers ────────────────────────────────────────────
function drawShape(shape: Shape, ctx: CanvasRenderingContext2D, strokeColor: string, fillColor: string) {
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = fillColor;
  ctx.lineWidth = 2;

  if (shape.type === "rectangle") {
    ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
    ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
  }
  if (shape.type === "circle") {
    ctx.beginPath();
    ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, 2 * Math.PI);
    ctx.fill(); ctx.stroke(); ctx.closePath();
  }
  if (shape.type === "pen") {
    ctx.beginPath();
    shape.points.forEach((p, i) => { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
    ctx.stroke(); ctx.closePath();
  }
  if (shape.type === "line") {
    ctx.beginPath(); ctx.moveTo(shape.x1, shape.y1); ctx.lineTo(shape.x2, shape.y2);
    ctx.stroke(); ctx.closePath();
  }
  if (shape.type === "diamond") {
    ctx.beginPath();
    ctx.moveTo(shape.centerX, shape.centerY - shape.halfHeight);
    ctx.lineTo(shape.centerX + shape.halfWidth, shape.centerY);
    ctx.lineTo(shape.centerX, shape.centerY + shape.halfHeight);
    ctx.lineTo(shape.centerX - shape.halfWidth, shape.centerY);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
}

function drawSelectionBox(shape: Shape, ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.strokeStyle = "#7C6FF7";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);

  if (shape.type === "rectangle") {
    ctx.strokeRect(shape.x - 4, shape.y - 4, shape.width + 8, shape.height + 8);
  } else if (shape.type === "circle") {
    const r = Math.abs(shape.radius) + 6;
    ctx.beginPath(); ctx.arc(shape.centerX, shape.centerY, r, 0, 2 * Math.PI); ctx.stroke();
  } else if (shape.type === "diamond") {
    ctx.beginPath();
    ctx.moveTo(shape.centerX, shape.centerY - shape.halfHeight - 6);
    ctx.lineTo(shape.centerX + shape.halfWidth + 6, shape.centerY);
    ctx.lineTo(shape.centerX, shape.centerY + shape.halfHeight + 6);
    ctx.lineTo(shape.centerX - shape.halfWidth - 6, shape.centerY);
    ctx.closePath(); ctx.stroke();
  } else if (shape.type === "line") {
    ctx.beginPath(); ctx.moveTo(shape.x1, shape.y1); ctx.lineTo(shape.x2, shape.y2);
    ctx.stroke();
    // dots at endpoints
    ctx.fillStyle = "#7C6FF7"; ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(shape.x1, shape.y1, 4, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(shape.x2, shape.y2, 4, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.restore();
}

function drawInProgressShape(shape: Shape, ctx: CanvasRenderingContext2D) {
  ctx.setLineDash([6, 4]);
  drawShape(shape, ctx, "rgba(124,111,247,0.7)", "rgba(124,111,247,0.08)");
  ctx.setLineDash([]);
}

function drawRemoteCursor(cursor: RemoteCursor, ctx: CanvasRenderingContext2D) {
  const { x, y, username, color } = cursor;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.stroke();

  const padding = 6;
  ctx.font = "11px Inter, system-ui, sans-serif";
  const tw = ctx.measureText(username).width;
  ctx.fillStyle = color; ctx.globalAlpha = 0.9;
  ctx.beginPath(); ctx.roundRect(x - (tw + padding * 2) / 2, y + 14, tw + padding * 2, 18, 9); ctx.fill();
  ctx.globalAlpha = 1; ctx.fillStyle = "#fff"; ctx.textAlign = "center";
  ctx.fillText(username, x, y + 27);
  ctx.restore();
}

// ── Shared state ───────────────────────────────────────────────
const remotePreviews: Map<string, Shape> = new Map();
const remoteCursors: Map<string, RemoteCursor> = new Map();

// ── Render ─────────────────────────────────────────────────────
function renderAll(
  existingShapes: Shape[],
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  panX: number,
  panY: number,
  selectedIndex: number
) {
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#121212";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dot grid
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  const spacing = 24;
  const startX = (panX % spacing + spacing) % spacing;
  const startY = (panY % spacing + spacing) % spacing;
  for (let gx = startX; gx < canvas.width; gx += spacing) {
    for (let gy = startY; gy < canvas.height; gy += spacing) {
      ctx.fillRect(gx - 0.5, gy - 0.5, 1, 1);
    }
  }

  // Apply pan
  ctx.translate(panX, panY);

  // Draw saved shapes
  existingShapes.forEach((shape, i) => {
    drawShape(shape, ctx, "rgba(255,255,255,0.85)", "rgba(255,255,255,0.06)");
    if (i === selectedIndex) {
      drawSelectionBox(shape, ctx);
    }
  });

  // Remote previews
  remotePreviews.forEach((shape) => drawInProgressShape(shape, ctx));

  // Remote cursors (in world space)
  remoteCursors.forEach((cursor) => drawRemoteCursor(cursor, ctx));

  ctx.restore();
}

// ── Data fetching ──────────────────────────────────────────────
async function getExistingShapes(roomId: string) {
  const res = await axios.get(`${HTTP_BACKEND}/user/chats/${roomId}`);
  const messages = res.data.messages;
  return messages.map((x: { message: string }) => {
    const messageData = JSON.parse(x.message);
    return messageData.shape;
  });
}

// ── Callbacks interface ────────────────────────────────────────
export interface DrawCallbacks {
  onMembersUpdate: (members: RoomMember[]) => void;
  onChatMessage: (msg: ChatMessage) => void;
  sendChatMessage: (text: string) => void;
}

// ── Main entry point ───────────────────────────────────────────
export async function initDraw(
  canvas: HTMLCanvasElement,
  roomId: string,
  socket: WebSocket,
  userName: string = "Anonymous",
  callbacks?: DrawCallbacks
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const existingShapes: Shape[] = await getExistingShapes(roomId);
  let redoStack: Shape[] = [];
  const displayName = userName || "Anonymous";

  // Pan state
  let panX = 0;
  let panY = 0;

  // Selection state
  let selectedIndex = -1;

  // Convert screen coords to world coords
  const toWorld = (sx: number, sy: number) => ({ x: sx - panX, y: sy - panY });

  // Members tracking
  const members: Map<string, RoomMember> = new Map();
  // Add self
  members.set(sessionUserId, { sessionUserId, username: displayName, color: sessionColor });
  callbacks?.onMembersUpdate(Array.from(members.values()));

  // ── Throttled senders ─────────────────────────────────────
  const sendDrawPreview = throttle((shape: Shape) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "draw_preview", roomId, shape, sessionUserId }));
    }
  }, 30);

  const sendCursorPosition = throttle((x: number, y: number) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "cursor_move", roomId, sessionUserId,
        x, y, username: displayName, color: sessionColor,
      }));
    }
  }, 50);

  // ── Chat sender (exposed via callbacks) ───────────────────
  if (callbacks) {
    callbacks.sendChatMessage = (text: string) => {
      if (socket.readyState === WebSocket.OPEN && text.trim()) {
        const msg: ChatMessage = {
          sessionUserId, username: displayName, color: sessionColor,
          text: text.trim(), timestamp: Date.now(),
        };
        socket.send(JSON.stringify({ type: "text_chat", roomId, ...msg }));
        callbacks.onChatMessage(msg); // show locally
      }
    };
  }

  // Announce join
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: "user_joined", roomId, sessionUserId,
      username: displayName, color: sessionColor,
    }));
  }

  // Stale cursor cleanup
  const cursorCleanup = setInterval(() => {
    const now = Date.now();
    let changed = false;
    remoteCursors.forEach((c, id) => {
      if (now - c.lastUpdate > 5000) { remoteCursors.delete(id); changed = true; }
    });
    if (changed) renderAll(existingShapes, ctx, canvas, panX, panY, selectedIndex);
  }, 2000);

  // ── Socket handler ────────────────────────────────────────
  socket.onmessage = (event) => {
    const d = JSON.parse(event.data);

    if (d.type === "chat") {
      const parsed = JSON.parse(d.message);
      if (parsed.shape) {
        if (d.userId) remotePreviews.delete(d.userId);
        if (d.sessionUserId) remotePreviews.delete(d.sessionUserId);
        existingShapes.push(parsed.shape);
        renderAll(existingShapes, ctx, canvas, panX, panY, selectedIndex);
      }
    }

    if (d.type === "draw_preview") {
      const sid = d.sessionUserId || d.userId;
      if (sid === sessionUserId) return;
      d.shape ? remotePreviews.set(sid, d.shape) : remotePreviews.delete(sid);
      renderAll(existingShapes, ctx, canvas, panX, panY, selectedIndex);
    }

    if (d.type === "cursor_move") {
      if (d.sessionUserId === sessionUserId) return;
      remoteCursors.set(d.sessionUserId, {
        x: d.x, y: d.y, username: d.username, color: d.color, lastUpdate: Date.now(),
      });
      renderAll(existingShapes, ctx, canvas, panX, panY, selectedIndex);
    }

    if (d.type === "shape_move") {
      if (d.sessionUserId === sessionUserId) return;
      const idx = d.shapeIndex;
      if (idx >= 0 && idx < existingShapes.length) {
        moveShape(existingShapes[idx]!, d.dx, d.dy);
        renderAll(existingShapes, ctx, canvas, panX, panY, selectedIndex);
      }
    }

    if (d.type === "user_joined") {
      if (d.sessionUserId !== sessionUserId) {
        members.set(d.sessionUserId, { sessionUserId: d.sessionUserId, username: d.username, color: d.color });
        callbacks?.onMembersUpdate(Array.from(members.values()));
        // Reply with our own presence so the new user sees us
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: "user_presence", roomId, sessionUserId,
            username: displayName, color: sessionColor,
          }));
        }
      }
    }

    if (d.type === "user_presence") {
      if (d.sessionUserId !== sessionUserId) {
        members.set(d.sessionUserId, { sessionUserId: d.sessionUserId, username: d.username, color: d.color });
        callbacks?.onMembersUpdate(Array.from(members.values()));
      }
    }

    if (d.type === "user_left") {
      remoteCursors.delete(d.sessionUserId);
      remotePreviews.delete(d.sessionUserId);
      members.delete(d.sessionUserId);
      callbacks?.onMembersUpdate(Array.from(members.values()));
      renderAll(existingShapes, ctx, canvas, panX, panY, selectedIndex);
    }

    if (d.type === "text_chat") {
      if (d.sessionUserId !== sessionUserId) {
        callbacks?.onChatMessage({
          sessionUserId: d.sessionUserId, username: d.username,
          color: d.color, text: d.text, timestamp: d.timestamp,
        });
      }
    }
  };

  renderAll(existingShapes, ctx, canvas, panX, panY, selectedIndex);

  // ── Mouse state ───────────────────────────────────────────
  let clicked = false;
  let startX = 0;
  let startY = 0;
  let currentPoints: { x: number; y: number }[] = [];
  let isDraggingShape = false;
  let isPanning = false;
  let dragLastX = 0;
  let dragLastY = 0;

  const undo = () => {
    if (existingShapes.length === 0) return;
    const s = existingShapes.pop();
    if (s) { redoStack.push(s); selectedIndex = -1; renderAll(existingShapes, ctx, canvas, panX, panY, selectedIndex); }
  };
  const redo = () => {
    if (redoStack.length === 0) return;
    const s = redoStack.pop();
    if (s) { existingShapes.push(s); renderAll(existingShapes, ctx, canvas, panX, panY, selectedIndex); }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const isCtrl = e.ctrlKey || e.metaKey;
    if (isCtrl && (e.key === "z" || e.key === "Z")) { e.preventDefault(); undo(); }
    if (isCtrl && (e.key === "y" || e.key === "Y")) { e.preventDefault(); redo(); }
    if (e.key === "Delete" || e.key === "Backspace") {
      if (selectedIndex >= 0 && selectedIndex < existingShapes.length) {
        existingShapes.splice(selectedIndex, 1);
        selectedIndex = -1;
        renderAll(existingShapes, ctx, canvas, panX, panY, selectedIndex);
      }
    }
    if (e.key === "Escape") {
      selectedIndex = -1;
      renderAll(existingShapes, ctx, canvas, panX, panY, selectedIndex);
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    clicked = true;
    startX = e.clientX;
    startY = e.clientY;
    dragLastX = e.clientX;
    dragLastY = e.clientY;

    // @ts-ignore
    const tool = window.selectedShape;

    if (tool === "hand") {
      isPanning = true;
      return;
    }

    if (tool === "select") {
      const world = toWorld(e.clientX, e.clientY);
      // Check shapes in reverse order (top-most first)
      let found = -1;
      for (let i = existingShapes.length - 1; i >= 0; i--) {
        if (hitTest(existingShapes[i]!, world.x, world.y)) {
          found = i;
          break;
        }
      }
      selectedIndex = found;
      isDraggingShape = found >= 0;
      renderAll(existingShapes, ctx, canvas, panX, panY, selectedIndex);
      return;
    }

    // Drawing tools
    selectedIndex = -1;
    if (tool === "pen") {
      const world = toWorld(startX, startY);
      currentPoints = [{ x: world.x, y: world.y }];
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (isPanning) { isPanning = false; clicked = false; return; }
    if (isDraggingShape) { isDraggingShape = false; clicked = false; return; }

    clicked = false;
    const world = toWorld(e.clientX, e.clientY);
    const worldStart = toWorld(startX, startY);
    const height = world.y - worldStart.y;
    const width = world.x - worldStart.x;
    // @ts-ignore
    const tool = window.selectedShape;
    let shape: Shape | null = null;

    if (tool === "select" || tool === "hand") return;

    if (tool === "rectangle") {
      shape = { type: "rectangle", x: worldStart.x, y: worldStart.y, width, height };
    } else if (tool === "circle") {
      const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
      shape = { type: "circle", centerX: worldStart.x + width / 2, centerY: worldStart.y + height / 2, radius };
    } else if (tool === "pen") {
      shape = { type: "pen", points: currentPoints };
      currentPoints = [];
    } else if (tool === "line") {
      shape = { type: "line", x1: worldStart.x, y1: worldStart.y, x2: world.x, y2: world.y };
    } else if (tool === "diamond") {
      shape = {
        type: "diamond",
        centerX: worldStart.x + width / 2, centerY: worldStart.y + height / 2,
        halfWidth: Math.abs(width) / 2, halfHeight: Math.abs(height) / 2,
      };
    }

    if (!shape) return;
    existingShapes.push(shape);

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "chat", roomId, message: JSON.stringify({ shape }), sessionUserId,
      }));
    }

    redoStack = [];
    renderAll(existingShapes, ctx, canvas, panX, panY, selectedIndex);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const worldPos = toWorld(e.clientX, e.clientY);
    sendCursorPosition(worldPos.x, worldPos.y);

    if (isPanning && clicked) {
      const dx = e.clientX - dragLastX;
      const dy = e.clientY - dragLastY;
      panX += dx;
      panY += dy;
      dragLastX = e.clientX;
      dragLastY = e.clientY;
      renderAll(existingShapes, ctx, canvas, panX, panY, selectedIndex);
      return;
    }

    if (isDraggingShape && clicked && selectedIndex >= 0) {
      const dx = e.clientX - dragLastX;
      const dy = e.clientY - dragLastY;
      moveShape(existingShapes[selectedIndex]!, dx, dy);
      dragLastX = e.clientX;
      dragLastY = e.clientY;

      // Broadcast move
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "shape_move", roomId, sessionUserId,
          shapeIndex: selectedIndex, dx, dy,
        }));
      }

      renderAll(existingShapes, ctx, canvas, panX, panY, selectedIndex);
      return;
    }

    if (clicked) {
      const worldStart = toWorld(startX, startY);
      const width = worldPos.x - worldStart.x;
      const height = worldPos.y - worldStart.y;
      // @ts-ignore
      const tool = window.selectedShape;
      let previewShape: Shape | null = null;

      if (tool === "pen") {
        currentPoints.push({ x: worldPos.x, y: worldPos.y });
        previewShape = { type: "pen", points: [...currentPoints] };
      } else if (tool === "rectangle") {
        previewShape = { type: "rectangle", x: worldStart.x, y: worldStart.y, width, height };
      } else if (tool === "circle") {
        const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
        previewShape = { type: "circle", centerX: worldStart.x + width / 2, centerY: worldStart.y + height / 2, radius };
      } else if (tool === "line") {
        previewShape = { type: "line", x1: worldStart.x, y1: worldStart.y, x2: worldPos.x, y2: worldPos.y };
      } else if (tool === "diamond") {
        previewShape = {
          type: "diamond",
          centerX: worldStart.x + width / 2, centerY: worldStart.y + height / 2,
          halfWidth: Math.abs(width) / 2, halfHeight: Math.abs(height) / 2,
        };
      }

      renderAll(existingShapes, ctx, canvas, panX, panY, selectedIndex);
      if (previewShape) {
        ctx.save();
        ctx.translate(panX, panY);
        drawShape(previewShape, ctx, "rgba(255,255,255,0.85)", "rgba(255,255,255,0.06)");
        ctx.restore();
        sendDrawPreview(previewShape);
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
    clearInterval(cursorCleanup);

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "user_left", roomId, sessionUserId }));
    }
  };
}
