"use client"
import React from 'react'
import { WS_BACKEND_URL } from "@/lib/config";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Canvas from './Canvas';

const RoomCanvas = ({roomId}:{roomId:string}) => {
   const [socket, setSocket] = useState<WebSocket | null>(null);
   const [status, setStatus] = useState<"connecting" | "connected" | "error">("connecting");
   const router = useRouter();
   const wsRef = useRef<WebSocket | null>(null);
   const mountedRef = useRef(true);
  
    useEffect(() => {
      mountedRef.current = true;

      function connect() {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/signin');
          return;
        }

        // Prevent double connections
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          return;
        }

        const ws = new WebSocket(`${WS_BACKEND_URL}?token=${token}`);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!mountedRef.current) { ws.close(); return; }
          setSocket(ws);
          setStatus("connected");
          ws.send(JSON.stringify({ type: "join_room", roomId }));
        }

        ws.onclose = (event) => {
          if (!mountedRef.current) return;
          console.log("WebSocket closed:", event.code, event.reason);
          setSocket(null);
          wsRef.current = null;
          
          if (event.code === 1008) {
            localStorage.removeItem('token');
            setStatus("error");
          } else if (event.code === 1006) {
            console.log("Connection lost, reconnecting in 2s...");
            setStatus("connecting");
            setTimeout(() => {
              if (mountedRef.current) connect();
            }, 2000);
          }
        }

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        }
      }

      connect();

      return () => {
        mountedRef.current = false;
        if (wsRef.current) {
          wsRef.current.onclose = null;
          wsRef.current.close();
          wsRef.current = null;
        }
        setSocket(null);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId])

    // Get the user's real name for cursor display
    const userName = typeof window !== 'undefined' 
      ? localStorage.getItem('userName') || 'Anonymous' 
      : 'Anonymous';

    if (status === "error") {
      return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center">
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
        <div className="min-h-screen bg-[#121212] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#F06E42] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-[#B3AC98] font-body">Connecting to room...</p>
          </div>
        </div>
      );
    }

  return (
    <div>
        <Canvas roomId={roomId} socket={socket} userName={userName} />
    </div>
  )
}

export default RoomCanvas