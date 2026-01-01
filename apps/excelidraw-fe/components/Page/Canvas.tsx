"use client";
import React, { useEffect, useRef } from "react";
import { initDraw } from "@/draw/initDraw";

const Canvas = ({ roomId, socket }: { roomId: string; socket: WebSocket }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      initDraw(canvasRef.current, roomId, socket);
    }
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
