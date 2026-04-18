import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
import { prismaClient } from '@repo/db/client';

import { WebSocketServer } from "ws";
import type { WebSocket as WsWebSocket } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

const WS_PORT = Number(process.env.PORT) || 8080;
const wss = new WebSocketServer({ port: WS_PORT });
console.log(`WebSocket server started on port ${WS_PORT}`);

interface User{
  ws: WsWebSocket;
  rooms: string[];
  userId: string;
}
const users: User[] = [];


function checkuser(token: string): string | null {
  try{
  const decoded = jwt.verify(token, JWT_SECRET);
  if (typeof decoded == "string") {
    return null;
  }

  if (!decoded || !decoded.userId) {
    return null;
  }

  return decoded.userId;
  }catch(e){
    return null;
  }
}

// Helper: broadcast to everyone in a room EXCEPT the sender
function broadcastToRoom(room: string, senderWs: WsWebSocket, message: object) {
  users.forEach(user => {
    if (user.rooms.includes(room) && user.ws !== senderWs) {
      user.ws.send(JSON.stringify(message));
    }
  });
}

wss.on("connection", function connection(ws, request) {
  const url = request.url;
  if (!url) {
    return;
  }
  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") || "";
  const userId = checkuser(token);
  if (!userId) {
    ws.close();
    return;
  }

  users.push({
    userId,
    rooms:[],
    ws
  })

  ws.on("message", async function message(data) {
    let parsedData;
    if(typeof data !== "string"){
      parsedData = JSON.parse(data.toString());
    }else{
      parsedData = JSON.parse(data);
    }

     
    if(parsedData.type ==="join_room"){
      const user = users.find(x => x.ws === ws);
      if(!user){
        return;
      }
      user.rooms.push(parsedData.roomId);
    }


    if(parsedData.type==="leave_room"){
      const user = users.find(x => x.ws === ws);
      if(!user){
        return;
      }
      user.rooms = user?.rooms.filter(x => x !== parsedData.roomId);
    }

    // ── Completed shape → save to DB + broadcast ────────────
    if(parsedData.type ==="chat"){
      const room = parsedData.roomId;
      const message = parsedData.message;
      
      try {
        await prismaClient.chat.create({
          data:{
            roomId: Number(room),
            userId: userId,
            message: message
          }
        })
      } catch(e) {
        console.error("Failed to save chat to DB:", e);
      }

      broadcastToRoom(room, ws, {
        type: "chat",
        roomId: room,
        message,
        userId: userId,
        sessionUserId: parsedData.sessionUserId,
      });
    }

    // ── Live drawing preview → broadcast only ───────────────
    if(parsedData.type === "draw_preview"){
      broadcastToRoom(parsedData.roomId, ws, {
        type: "draw_preview",
        roomId: parsedData.roomId,
        shape: parsedData.shape,
        userId: userId,
        sessionUserId: parsedData.sessionUserId,
      });
    }

    // ── Shape move → broadcast only ─────────────────────────
    if(parsedData.type === "shape_move"){
      broadcastToRoom(parsedData.roomId, ws, {
        type: "shape_move",
        roomId: parsedData.roomId,
        sessionUserId: parsedData.sessionUserId,
        shapeIndex: parsedData.shapeIndex,
        dx: parsedData.dx,
        dy: parsedData.dy,
      });
    }

    // ── Cursor movement → broadcast only ────────────────────
    if(parsedData.type === "cursor_move"){
      broadcastToRoom(parsedData.roomId, ws, {
        type: "cursor_move",
        roomId: parsedData.roomId,
        sessionUserId: parsedData.sessionUserId,
        x: parsedData.x,
        y: parsedData.y,
        username: parsedData.username,
        color: parsedData.color,
      });
    }

    // ── User joined → broadcast only ────────────────────────
    if(parsedData.type === "user_joined"){
      broadcastToRoom(parsedData.roomId, ws, {
        type: "user_joined",
        roomId: parsedData.roomId,
        sessionUserId: parsedData.sessionUserId,
        username: parsedData.username,
        color: parsedData.color,
      });
    }

    // ── User presence reply → broadcast only ────────────────
    if(parsedData.type === "user_presence"){
      broadcastToRoom(parsedData.roomId, ws, {
        type: "user_presence",
        roomId: parsedData.roomId,
        sessionUserId: parsedData.sessionUserId,
        username: parsedData.username,
        color: parsedData.color,
      });
    }

    // ── Text chat → broadcast only (ephemeral) ──────────────
    if(parsedData.type === "text_chat"){
      broadcastToRoom(parsedData.roomId, ws, {
        type: "text_chat",
        roomId: parsedData.roomId,
        sessionUserId: parsedData.sessionUserId,
        username: parsedData.username,
        color: parsedData.color,
        text: parsedData.text,
        timestamp: parsedData.timestamp,
      });
    }

    // ── User left → broadcast only ──────────────────────────
    if(parsedData.type === "user_left"){
      broadcastToRoom(parsedData.roomId, ws, {
        type: "user_left",
        roomId: parsedData.roomId,
        sessionUserId: parsedData.sessionUserId,
      });
    }
  });

  // Clean up when connection closes
  ws.on("close", () => {
    const idx = users.findIndex(x => x.ws === ws);
    if (idx !== -1) {
      users.splice(idx, 1);
    }
  });
});
