import { z } from "zod";

export const CreateUserSchema = z.object({
    email: z.string().min(3).max(100).email(),
    password: z.string(),
    name: z.string()
})

export const SigninSchema = z.object({
    email: z.string().min(3).max(100).email(),
    password: z.string(),
})

export const CreateRoomSchema = z.object({
    
    slug: z.string().min(3).max(20),
   

})

// ── Drawing Types (shared across frontend) ────────────────────

export type Shape =
  | { type: "rectangle"; x: number; y: number; height: number; width: number }
  | { type: "circle"; centerX: number; centerY: number; radius: number }
  | { type: "pen"; points: { x: number; y: number }[] }
  | { type: "line"; x1: number; y1: number; x2: number; y2: number }
  | { type: "diamond"; centerX: number; centerY: number; halfWidth: number; halfHeight: number };

export interface RemoteCursor {
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

export interface DrawCallbacks {
  onMembersUpdate: (members: RoomMember[]) => void;
  onChatMessage: (msg: ChatMessage) => void;
  sendChatMessage: (text: string) => void;
}
