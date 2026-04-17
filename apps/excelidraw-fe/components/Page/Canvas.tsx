"use client";
import React, { useEffect, useRef } from "react";
import { initDraw } from "@/draw/initDraw";
import { useState } from "react";
import { Square } from "lucide-react";
import { Circle } from "lucide-react";
import { PenLine } from "lucide-react";
import { Hand } from "lucide-react";
import { Minus } from "lucide-react";
import { Diamond } from 'lucide-react';
type tools = "rectangle" | "circle" | "pen" | "line" | "select" | "text" | "diamond" | "hand";

const Canvas = ({ roomId, socket }: { roomId: string; socket: WebSocket }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTool, setselectedTool] = useState<tools>("rectangle");

  const [canvasSize,setCanvasSize] = useState({
    width:window.innerWidth,
    height:window.innerHeight
  })

  useEffect(() => {
    //@ts-ignore
    window.selectedShape = selectedTool;
  }, [selectedTool]);
  useEffect(()=>{
   
    const handleResize=()=>{
      setCanvasSize({
        width:window.innerWidth,  
        height:window.innerHeight
      })
    }

    window.addEventListener("resize",handleResize);
    return ()=> window.removeEventListener("resize",handleResize);
  })
  useEffect(() => {
    let cleanupFunc: (() => void) | undefined;
    const startDrawing = async () => {
      if (canvasRef.current) {
        cleanupFunc = await initDraw(canvasRef.current, roomId, socket);
      }
    };
    startDrawing();

    return () => {
      if (cleanupFunc) {
        cleanupFunc();
      }
    };
  }, [canvasRef,canvasSize]);

  return (
    <div className="relative overflow-hidden ">
      <TopBar selectedTool={selectedTool} setselectedTool={setselectedTool} />
      <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} className="touch-none"/>
    </div>
  );
};

export default Canvas;



function TopBar({
  selectedTool,
  setselectedTool,
}: {
  selectedTool: tools;
  setselectedTool: (s: tools) => void;
}) {
  return (
    <div className=" gap-5 fixed top-0 left-0 w-full h-12 flex items-center space-x-4 p-2 z-10">
      <div
        onClick={() => setselectedTool("rectangle")}
        className={
          selectedTool === "rectangle" ? "text-amber-200 p-1 rounded" : ""
        }
      >
        <Square />
      </div>

      <div
        onClick={() => setselectedTool("circle")}
        className={
          selectedTool === "circle" ? "text-amber-200 p-1 rounded" : ""
        }
      >
        <Circle />
      </div>
      <div
        onClick={() => setselectedTool("pen")}
        className={selectedTool === "pen" ? "text-amber-200 p-1 rounded" : ""}
      >
        <PenLine />
      </div>
      <div 
      onClick={()=>setselectedTool("line")}
      className={selectedTool==="line"?"text-amber-200 p-1 rounded":""}
      
      >
        <Minus />
      </div>

      <div
      onClick={()=>setselectedTool("diamond")}
      className={selectedTool==="diamond"?"text-amber-200 p-1 rounded":""}
      >
        <Diamond />
      </div>
      <div
        onClick={() => setselectedTool("hand")}
        className={selectedTool === "hand" ? "text-amber-200 p-1 rounded bg-gray-700" : "p-1"}
      >
        <Hand />
      </div>
      
    </div>
  );
}
