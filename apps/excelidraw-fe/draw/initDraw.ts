import axios from "axios";
import { HTTP_BACKEND } from "@/lib/config";
import { useEffect } from "react";
import { useState } from "react";

type Shape =
  | {
      type: "rectangle";
      x: number;
      y: number;
      height: number;
      width: number;
    }
  | {
      type: "circle";
      centerX: number;
      centerY: number;
      radius: number;
    }
  | {
      type: "pen";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    };

function clearCanvas(
  existingShapes: Shape[],
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  existingShapes.map((shape) => {
    if (shape.type === "rectangle") {
      ctx.strokeStyle = "red";
      ctx.fillStyle = "rgba(255,0,0,0.3)";
      ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    }

    if (shape.type === "circle") {
      ctx.strokeStyle = "red";
      ctx.fillStyle = "rgba(255,0,0,0.3)";
      ctx.beginPath();
      ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.closePath();
    }
  });
}

async function getExistingShapes(roomId: string) {
  const res = await axios.get(`${HTTP_BACKEND}/user/chats/${roomId}`);
  const messages = res.data.messages;
  const shapes = messages.map((x: { message: string }) => {
    const messageData = JSON.parse(x.message);

    return messageData.shape;
  });
  console.log("Existing Shapes: ", shapes);

  return shapes;
}

export async function initDraw(
  canvas: HTMLCanvasElement,
  roomId: string,
  socket: WebSocket
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  //const existingShapes: Shape[] = await getExistingShapes(roomId);
  const existingShapes: Shape[] = await getExistingShapes(roomId);

  socket.onmessage = (event) => {
    const parsedData = JSON.parse(event.data);
    if (parsedData.type === "chat") {
      const parsedShape = JSON.parse(parsedData.message);
      existingShapes.push(parsedShape);
      clearCanvas(existingShapes, ctx, canvas);
    }
  };

  clearCanvas(existingShapes, ctx, canvas);

  let clicked = false;
  let startX = 0;
  let startY = 0;

  canvas.addEventListener("mousedown", (e) => {
    clicked = true;
    startX = e.clientX;
    startY = e.clientY;
  });

  canvas.addEventListener("mouseup", (e) => {
    clicked = false;
    console.log("Mouse Up at ", e.clientX, e.clientY);
    const height = e.clientY - startY;
    const width = e.clientX - startX;
    const selectedShape = window.selectedShape;
    let shape: Shape | null;
    if (selectedShape === "rectangle") {
      shape = {
        type: "rectangle",
        x: startX,
        y: startY,
        width: width,
        height: height,
      };
    } else if (selectedShape === "circle") {
      const radius = Math.max(width, height) / 2;
      shape = {
        type: "circle",
        centerX: startX + radius,
        centerY: startY + radius,
        radius: Math.max(width, height) / 2,
      };
    }

    if (!shape) {
      return;
    }
    existingShapes.push(shape);

    socket.send(
      JSON.stringify({
        type: "chat",
        roomId: roomId,
        message: JSON.stringify({ shape }),
      })
    );
  });

  canvas.addEventListener("mousemove", (e) => {
    if (clicked) {
      const width = e.clientX - startX;
      const height = e.clientY - startY;

      clearCanvas(existingShapes, ctx, canvas);
      ctx.strokeStyle = "red";
      ctx.fillStyle = "rgba(255,0,0,0.3)";

      const selectedShape = window.selectedShape;
      if (selectedShape === "rectangle") {
        ctx.fillRect(startX, startY, width, height);
        ctx.strokeRect(startX, startY, width, height);
      } else if (selectedShape === "circle") {
        const radius = Math.max(width, height) / 2;
       const centerX = startX + radius;
        const centerY = startY + radius;
        
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.abs(radius), 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
      } else if (selectedShape === "pen") {
        ctx.lineWidth = 2;
        ctx.lineTo(e.clientX, e.clientY);
        ctx.stroke();
      }
    }
  });
}
