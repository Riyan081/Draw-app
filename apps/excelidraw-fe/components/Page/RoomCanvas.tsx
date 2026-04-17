"use client"
import React from 'react'
import { WS_BACKEND_URL } from "@/lib/config";
import { useState,useEffect } from 'react';
import Canvas from './Canvas';

const RoomCanvas = ({roomId}:{roomId:string}) => {
   const[socket,setSocket]=useState<WebSocket|null>(null);
  
    useEffect(()=>{
      const ws = new WebSocket(`${WS_BACKEND_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwOGRjYjhhMy0wNjEyLTRhNmQtODQ5OC02NmRiODJmMzhhMGQiLCJpYXQiOjE3NzMxNTcyMzUsImV4cCI6MTc3Mzg0ODQzNX0.z9hzPHWaoyfcuBQ2BovaeBiWeCnYTBLtTBmIuewfq1s`);

      ws.onopen=()=>{
        setSocket(ws);
        ws.send(JSON.stringify({type:"join_room", roomId})) ;
      }

      ws.onclose = () => {
        console.log("WebSocket closed");
        setSocket(null);
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      }

      // Cleanup on unmount
      return () => {
        ws.close();
        setSocket(null);
      }
    },[roomId])
  
    if(!socket){
      return <div>Connecting to WebSocket...</div>
    }

    
  return (
    <div>
        <Canvas roomId={roomId} socket={socket} />
    </div>
  )
}

export default RoomCanvas