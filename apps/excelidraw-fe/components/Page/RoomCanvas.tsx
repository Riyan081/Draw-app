"use client"
import React from 'react'
import { WS_BACKEND_URL } from "@/lib/config";
import { useState,useEffect } from 'react';
import Canvas from './Canvas';

const RoomCanvas = ({roomId}:{roomId:string}) => {
   const[socket,setSocket]=useState<WebSocket|null>(null);
  
    useEffect(()=>{
      const ws = new WebSocket(`${WS_BACKEND_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwOGRjYjhhMy0wNjEyLTRhNmQtODQ5OC02NmRiODJmMzhhMGQiLCJpYXQiOjE3NjcyNzY4ODMsImV4cCI6MTc2Nzk2ODA4M30.X7N_d4JNG7s-i-zflTHQP9sMQKgkexAbx1MF9mkEC10`);
      ws.onopen=()=>{
        setSocket(ws);
        ws.send(JSON.stringify({type:"join_room", roomId})) ;
      }
    },[])
  
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