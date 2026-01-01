"use client";
import React, { useEffect, useRef } from "react";
import axios from "axios";
import { HTTP_BACKEND } from "@/lib/config";

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
  });
}

async function getExistingShapes(roomId: string) {
  const res = await axios.get(`${HTTP_BACKEND}/chats/${roomId}`);
  const messages = res.data.messages;
  const shapes = messages.map((x: { message: string }) => {
    const messageData = JSON.parse(x.message);
    
    return messageData;

  });
  console.log("Existing Shapes: ", shapes);

  return shapes;
}

const Canvas = ({ roomId,socket }: { roomId: string, socket: WebSocket }) => {

 
    
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const existingShapes: Shape[] = [];

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    socket.onmessage = (event)=>{
      const parsedData = JSON.parse(event.data);
      if(parsedData.type==="chat"){
        const parsedShape = JSON.parse(parsedData.message); 
        existingShapes.push(parsedShape);
        clearCanvas(existingShapes, ctx, canvas);
      }
    }
    

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
     const shape: Shape = {
        type: "rectangle",
        x: startX,
        y: startY,
        width: e.clientX - startX,
        height: e.clientY - startY,
      }
      existingShapes.push(shape);       
    

      socket.send(JSON.stringify({
        type: "chat",
        roomId: roomId,
        message: JSON.stringify({shape}),
      }));

    });

    canvas.addEventListener("mousemove", (e) => {
      if (clicked) {
        const width = e.clientX - startX;
        const height = e.clientY - startY;

        clearCanvas(existingShapes, ctx, canvas);

        ctx.strokeStyle = "red";
        ctx.fillStyle = "rgba(255,0,0,0.3)";
        ctx.fillRect(startX, startY, width, height);
        ctx.strokeRect(startX, startY, width, height);
      }
    });
  }, [canvasRef]);

  return (

    <div>
      <canvas ref={canvasRef} width={1550} height={700} />
      <div className="absolute top-2 left-2 text-white  flex gap-4">
        <div className="bg-amber-50 text-black">Rect</div>
        <div className="bg-amber-50 text-black ">Circle</div>
      </div>
    </div>
  );
};

export default Canvas;
