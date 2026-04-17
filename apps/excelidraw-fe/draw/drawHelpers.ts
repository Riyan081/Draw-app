import { Shape, RemoteCursor } from "@repo/common/types";

// ── Draw a shape with given colors ──────────────────────────
export function drawShape(
  shape: Shape, ctx: CanvasRenderingContext2D,
  strokeColor: string, fillColor: string
) {
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

// ── Selection box (dashed purple border) ────────────────────
export function drawSelectionBox(shape: Shape, ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.strokeStyle = "#7C6FF7";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);

  if (shape.type === "rectangle") {
    ctx.strokeRect(shape.x - 4, shape.y - 4, shape.width + 8, shape.height + 8);
  } else if (shape.type === "circle") {
    ctx.beginPath(); ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius) + 6, 0, 2 * Math.PI); ctx.stroke();
  } else if (shape.type === "diamond") {
    ctx.beginPath();
    ctx.moveTo(shape.centerX, shape.centerY - shape.halfHeight - 6);
    ctx.lineTo(shape.centerX + shape.halfWidth + 6, shape.centerY);
    ctx.lineTo(shape.centerX, shape.centerY + shape.halfHeight + 6);
    ctx.lineTo(shape.centerX - shape.halfWidth - 6, shape.centerY);
    ctx.closePath(); ctx.stroke();
  } else if (shape.type === "line") {
    ctx.beginPath(); ctx.moveTo(shape.x1, shape.y1); ctx.lineTo(shape.x2, shape.y2); ctx.stroke();
    ctx.fillStyle = "#7C6FF7"; ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(shape.x1, shape.y1, 4, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(shape.x2, shape.y2, 4, 0, 2 * Math.PI); ctx.fill();
  }
  ctx.restore();
}

// ── In-progress shape (dashed purple from other user) ───────
export function drawInProgressShape(shape: Shape, ctx: CanvasRenderingContext2D) {
  ctx.setLineDash([6, 4]);
  drawShape(shape, ctx, "rgba(124,111,247,0.7)", "rgba(124,111,247,0.08)");
  ctx.setLineDash([]);
}

// ── Remote cursor (dot + name pill) ─────────────────────────
export function drawRemoteCursor(cursor: RemoteCursor, ctx: CanvasRenderingContext2D) {
  const { x, y, username, color } = cursor;
  ctx.save();

  // Dot
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();

  // Ring
  ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.stroke();

  // Name pill
  const padding = 6;
  ctx.font = "11px Inter, system-ui, sans-serif";
  const tw = ctx.measureText(username).width;
  ctx.fillStyle = color; ctx.globalAlpha = 0.9;
  ctx.beginPath(); ctx.roundRect(x - (tw + padding * 2) / 2, y + 14, tw + padding * 2, 18, 9); ctx.fill();
  ctx.globalAlpha = 1; ctx.fillStyle = "#fff"; ctx.textAlign = "center";
  ctx.fillText(username, x, y + 27);

  ctx.restore();
}
