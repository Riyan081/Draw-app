"use client"
import React from 'react'
import { WS_BACKEND_URL } from "@/lib/config";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Canvas from './Canvas';

const RoomCanvas = ({roomId}:{roomId:string}) => {
   const [socket, setSocket] = useState<WebSocket | null>(null);
   const [status, setStatus] = useState<"connecting" | "connected" | "error">("connecting");
   const router = useRouter();
  
    useEffect(() => {
      // Read token from localStorage (set during login from response body)
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/signin');
        return;
      }

      const ws = new WebSocket(`${WS_BACKEND_URL}?token=${token}`);

      ws.onopen = () => {
        setSocket(ws);
        setStatus("connected");
        ws.send(JSON.stringify({ type: "join_room", roomId }));
      }

      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        setSocket(null);
        // Code 1008 = policy violation (auth failed)
        if (event.code === 1008 || event.code === 1006) {
          localStorage.removeItem('token');
          setStatus("error");
        }
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setStatus("error");
      }

      // Cleanup on unmount
      return () => {
        ws.close();
        setSocket(null);
      }
    }, [roomId, router])
  
    if (status === "error") {
      return (
        <div className="min-h-screen bg-[#14181F] flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-red-400 font-body text-lg">Failed to connect. Your session may have expired.</p>
            <button 
              onClick={() => router.push('/signin')}
              className="px-6 py-2 bg-[#F06E42] text-black rounded-lg font-body hover:bg-[#e55d31] transition-colors"
            >
              Sign in again
            </button>
          </div>
        </div>
      );
    }

    if (!socket) {
      return (
        <div className="min-h-screen bg-[#14181F] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#F06E42] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-[#B3AC98] font-body">Connecting to room...</p>
          </div>
        </div>
      );
    }

    
  return (
    <div>
        <Canvas roomId={roomId} socket={socket} />
    </div>
  )
}

export default RoomCanvas