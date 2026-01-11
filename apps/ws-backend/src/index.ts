import { prismaClient } from '@repo/db/client';

import { WebSocketServer } from "ws";
import type { WebSocket as WsWebSocket } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

const wss = new WebSocketServer({ port: 8080 });

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

    if(parsedData.type ==="chat"){
      const room = parsedData.roomId;
      const message = parsedData.message;
      const sessionUserId = parsedData.sessionUserId;
      
      await prismaClient.chat.create({
        data:{
          roomId: Number(room),
          userId: userId,
          message: message
        }
      })

      users.forEach(user=>{
        if(user.rooms.includes(room)){
          user.ws.send(JSON.stringify({
            type:"chat",
            roomId: room,
            message,
            sessionUserId: sessionUserId // Include so users can track who sent it
          }))
        }
      })
    }

    // Handle live drawing progress - broadcast to room WITHOUT saving to DB
    if(parsedData.type === "drawing_progress"){
      const room = parsedData.roomId;
      const shape = parsedData.shape;
      const sessionUserId = parsedData.sessionUserId;

      users.forEach(user=>{
        if(user.rooms.includes(room) && user.ws !== ws){
          // Don't send back to the sender
          user.ws.send(JSON.stringify({
            type: "drawing_progress",
            roomId: room,
            shape: shape,
            sessionUserId: sessionUserId
          }))
        }
      })
    }

    // Handle drawing complete notification
    if(parsedData.type === "drawing_complete"){
      const room = parsedData.roomId;
      const sessionUserId = parsedData.sessionUserId;

      users.forEach(user=>{
        if(user.rooms.includes(room) && user.ws !== ws){
          user.ws.send(JSON.stringify({
            type: "drawing_complete",
            roomId: room,
            sessionUserId: sessionUserId
          }))
        }
      })
    }

    // Handle cursor movement - broadcast to room WITHOUT saving to DB
    if(parsedData.type === "cursor_move"){
      const room = parsedData.roomId;
      const sessionUserId = parsedData.sessionUserId;
      const x = parsedData.x;
      const y = parsedData.y;
      const username = parsedData.username;
      const color = parsedData.color;

      users.forEach(user=>{
        if(user.rooms.includes(room) && user.ws !== ws){
          user.ws.send(JSON.stringify({
            type: "cursor_move",
            roomId: room,
            sessionUserId: sessionUserId,
            x: x,
            y: y,
            username: username,
            color: color
          }))
        }
      })
    }

    // Handle user leaving notification
    if(parsedData.type === "user_left"){
      const room = parsedData.roomId;
      const sessionUserId = parsedData.sessionUserId;

      users.forEach(user=>{
        if(user.rooms.includes(room) && user.ws !== ws){
          user.ws.send(JSON.stringify({
            type: "user_left",
            roomId: room,
            sessionUserId: sessionUserId
          }))
        }
      })
    }
  });
});
