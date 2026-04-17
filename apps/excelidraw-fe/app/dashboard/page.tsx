"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { HTTP_BACKEND } from "@/lib/config";
import { Pencil, Plus, ArrowRight, Loader2, LogOut, Clock, PenLine, Users } from "lucide-react";
import Link from "next/link";

interface RoomInfo {
  id: number;
  slug: string;
  createdAt: string;
  drawingCount: number;
}

export default function DashboardPage() {
  const router = useRouter();

  // Create room state
  const [createSlug, setCreateSlug] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Join room state
  const [joinSlug, setJoinSlug] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");

  // My rooms state
  const [createdRooms, setCreatedRooms] = useState<RoomInfo[]>([]);
  const [joinedRooms, setJoinedRooms] = useState<RoomInfo[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);

  // Fetch rooms on mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { router.push("/signin"); return; }

        const res = await axios.get(`${HTTP_BACKEND}/user/rooms`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        if (res.data.success) {
          setCreatedRooms(res.data.createdRooms || []);
          setJoinedRooms(res.data.joinedRooms || []);
        }
      } catch {
        // silently fail — rooms section just won't show
      } finally {
        setRoomsLoading(false);
      }
    };
    fetchRooms();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!createSlug.trim()) return;

    setCreateLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${HTTP_BACKEND}/user/room`,
        { slug: createSlug.trim() },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (res.data.success) {
        router.push(`/canvas/${res.data.room.id}`);
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setCreateError("Session expired. Please sign in again.");
        setTimeout(() => router.push("/signin"), 1500);
      } else if (err.response?.data?.error) {
        setCreateError(err.response.data.error);
      } else {
        setCreateError("Failed to create room. Try a different name.");
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError("");
    if (!joinSlug.trim()) return;

    setJoinLoading(true);
    try {
      const res = await axios.get(
        `${HTTP_BACKEND}/user/room/${joinSlug.trim()}`,
        { withCredentials: true }
      );

      if (res.data.success && res.data.room) {
        router.push(`/canvas/${res.data.room.id}`);
      } else {
        setJoinError("Room not found. Check the name and try again.");
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setJoinError("Room not found.");
      } else {
        setJoinError("Failed to find room. Check the name.");
      }
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/signin");
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const allRooms = createdRooms.length + joinedRooms.length;

  return (
    <div className="min-h-screen bg-[#14181F] text-white">
      {/* Header */}
      <header className="border-b border-[#262C36]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-[#F06E42] flex items-center justify-center wiggle">
              <Pencil className="w-5 h-5 text-[#0e0806]" />
            </div>
            <span className="font-display text-2xl font-bold">Sketchy</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-[#B3AC98] hover:text-white transition-colors font-body text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="font-display text-5xl font-bold text-white mb-3">
            Your Canvas
          </h1>
          <p className="text-[#B3AC98] font-body text-lg">
            Create a new room or join an existing one to start collaborating.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create Room Card */}
          <div className="border border-[#262C36] rounded-2xl p-8 bg-[#1A1F27] hover:border-[#F06E42]/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-[#F06E42]/10 flex items-center justify-center mb-6">
              <Plus className="w-6 h-6 text-[#F06E42]" />
            </div>
            <h2 className="font-display text-3xl font-bold text-white mb-2">
              Create Room
            </h2>
            <p className="text-[#B3AC98] font-body text-sm mb-6">
              Start a fresh canvas. Share the room name with others to collaborate.
            </p>

            {createError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-body">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <input
                type="text"
                placeholder="Enter room name..."
                value={createSlug}
                onChange={(e) => setCreateSlug(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#14181F] border border-[#262C36] text-white font-body text-sm placeholder:text-[#555] focus:outline-none focus:border-[#F06E42]/50 transition-colors"
                required
                minLength={3}
                maxLength={20}
              />
              <button
                type="submit"
                disabled={createLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#F06E42] text-black font-body font-semibold rounded-xl hover:bg-[#e55d31] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                ) : (
                  <><Plus className="w-4 h-4" /> Create Room</>
                )}
              </button>
            </form>
          </div>

          {/* Join Room Card */}
          <div className="border border-[#262C36] rounded-2xl p-8 bg-[#1A1F27] hover:border-[#F06E42]/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-[#F06E42]/10 flex items-center justify-center mb-6">
              <ArrowRight className="w-6 h-6 text-[#F06E42]" />
            </div>
            <h2 className="font-display text-3xl font-bold text-white mb-2">
              Join Room
            </h2>
            <p className="text-[#B3AC98] font-body text-sm mb-6">
              Enter a room name to join an existing canvas and draw together.
            </p>

            {joinError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-body">
                {joinError}
              </div>
            )}

            <form onSubmit={handleJoinRoom} className="space-y-4">
              <input
                type="text"
                placeholder="Enter room name..."
                value={joinSlug}
                onChange={(e) => setJoinSlug(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#14181F] border border-[#262C36] text-white font-body text-sm placeholder:text-[#555] focus:outline-none focus:border-[#F06E42]/50 transition-colors"
                required
              />
              <button
                type="submit"
                disabled={joinLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-transparent border-2 border-[#F06E42] text-[#F06E42] font-body font-semibold rounded-xl hover:bg-[#F06E42]/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joinLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Finding room...</>
                ) : (
                  <><ArrowRight className="w-4 h-4" /> Join Room</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ── My Rooms Section ───────────────────────────────── */}
        <div className="mt-16">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="font-display text-3xl font-bold text-white">My Rooms</h2>
            {!roomsLoading && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#262C36] text-[#B3AC98] text-xs font-body">
                {allRooms}
              </span>
            )}
          </div>

          {roomsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#F06E42]" />
            </div>
          ) : allRooms === 0 ? (
            <div className="text-center py-12 border border-[#262C36] rounded-2xl bg-[#1A1F27]">
              <PenLine className="w-10 h-10 text-[#555] mx-auto mb-3" />
              <p className="text-[#B3AC98] font-body text-sm">
                No rooms yet. Create or join one above to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Created by me */}
              {createdRooms.length > 0 && (
                <div>
                  <h3 className="text-xs font-body font-semibold text-[#B3AC98] uppercase tracking-wider mb-3">
                    Created by you
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {createdRooms.map((room) => (
                      <RoomCard key={room.id} room={room} isOwner />
                    ))}
                  </div>
                </div>
              )}

              {/* Joined */}
              {joinedRooms.length > 0 && (
                <div>
                  <h3 className="text-xs font-body font-semibold text-[#B3AC98] uppercase tracking-wider mb-3">
                    Joined rooms
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {joinedRooms.map((room) => (
                      <RoomCard key={room.id} room={room} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Room Card Component ─────────────────────────────────────────
function RoomCard({ room, isOwner = false }: { room: RoomInfo; isOwner?: boolean }) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric",
    });
  };

  return (
    <Link
      href={`/canvas/${room.id}`}
      className="group border border-[#262C36] rounded-xl p-5 bg-[#1A1F27] hover:border-[#F06E42]/40 transition-all duration-300 block"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: isOwner ? "rgba(240,110,66,0.1)" : "rgba(124,111,247,0.1)" }}
          >
            {isOwner
              ? <Pencil className="w-4 h-4 text-[#F06E42]" />
              : <Users className="w-4 h-4 text-[#7C6FF7]" />
            }
          </div>
          <span className="font-body font-semibold text-white text-sm group-hover:text-[#F06E42] transition-colors truncate max-w-[120px]">
            {room.slug}
          </span>
        </div>
        <ArrowRight className="w-4 h-4 text-[#555] group-hover:text-[#F06E42] transition-colors" />
      </div>

      <div className="flex items-center gap-4 text-xs text-[#666] font-body">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDate(room.createdAt)}
        </span>
        <span className="flex items-center gap-1">
          <PenLine className="w-3 h-3" />
          {room.drawingCount} drawings
        </span>
      </div>
    </Link>
  );
}
