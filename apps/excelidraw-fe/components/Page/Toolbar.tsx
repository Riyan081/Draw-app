"use client";
import React from "react";
import {
  Square, Circle, PenLine, Minus, Diamond, Hand,
  MousePointer2,
} from "lucide-react";

export type Tool = "select" | "hand" | "rectangle" | "diamond" | "circle" | "line" | "pen";

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

export { tools };

export default function Toolbar({
  selectedTool,
  onSelectTool,
}: {
  selectedTool: Tool;
  onSelectTool: (t: Tool) => void;
}) {
  const style = {
    background: "#232329",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
  };

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-0.5 px-1.5 py-1.5 rounded-xl shadow-2xl" style={style}>
        {tools.map((tool, i) => (
          <React.Fragment key={tool.id}>
            {i === 2 && <div className="w-px h-6 mx-0.5" style={{ background: "rgba(255,255,255,0.1)" }} />}
            <button
              onClick={() => onSelectTool(tool.id)}
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
  );
}
