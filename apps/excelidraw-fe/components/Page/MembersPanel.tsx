"use client";
import React from "react";
import { X } from "lucide-react";
import { RoomMember } from "@repo/common/types";

export default function MembersPanel({
  members,
  onClose,
}: {
  members: RoomMember[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed top-14 right-4 z-30 w-56 rounded-xl overflow-hidden"
      style={{
        background: "#1E1E24",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
          Members ({members.length})
        </span>
        <button onClick={onClose}>
          <X size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
        </button>
      </div>

      {/* Member list */}
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
  );
}
