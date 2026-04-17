import { Shape } from "@repo/common/types";

// ── Hit testing — check if a point is inside a shape ────────
export function hitTest(shape: Shape, px: number, py: number): boolean {
  if (shape.type === "rectangle") {
    const minX = Math.min(shape.x, shape.x + shape.width);
    const maxX = Math.max(shape.x, shape.x + shape.width);
    const minY = Math.min(shape.y, shape.y + shape.height);
    const maxY = Math.max(shape.y, shape.y + shape.height);
    return px >= minX && px <= maxX && py >= minY && py <= maxY;
  }
  if (shape.type === "circle") {
    const dx = px - shape.centerX;
    const dy = py - shape.centerY;
    return Math.sqrt(dx * dx + dy * dy) <= Math.abs(shape.radius) + 5;
  }
  if (shape.type === "diamond") {
    const dx = Math.abs(px - shape.centerX) / shape.halfWidth;
    const dy = Math.abs(py - shape.centerY) / shape.halfHeight;
    return dx + dy <= 1.1;
  }
  if (shape.type === "line") {
    return distPointToLine(px, py, shape.x1, shape.y1, shape.x2, shape.y2) <= 8;
  }
  if (shape.type === "pen") {
    for (let i = 1; i < shape.points.length; i++) {
      const p1 = shape.points[i - 1]!;
      const p2 = shape.points[i]!;
      if (distPointToLine(px, py, p1.x, p1.y, p2.x, p2.y) <= 8) return true;
    }
  }
  return false;
}

// ── Distance from point to line segment ─────────────────────
function distPointToLine(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  const C = x2 - x1, D = y2 - y1;
  const lenSq = C * C + D * D;
  let t = lenSq !== 0 ? ((px - x1) * C + (py - y1) * D) / lenSq : -1;
  t = Math.max(0, Math.min(1, t));
  const xx = x1 + t * C, yy = y1 + t * D;
  return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2);
}

// ── Move a shape by dx, dy ──────────────────────────────────
export function moveShape(shape: Shape, dx: number, dy: number) {
  if (shape.type === "rectangle") { shape.x += dx; shape.y += dy; }
  if (shape.type === "circle")    { shape.centerX += dx; shape.centerY += dy; }
  if (shape.type === "diamond")   { shape.centerX += dx; shape.centerY += dy; }
  if (shape.type === "line")      { shape.x1 += dx; shape.y1 += dy; shape.x2 += dx; shape.y2 += dy; }
  if (shape.type === "pen")       { shape.points.forEach(p => { p.x += dx; p.y += dy; }); }
}
