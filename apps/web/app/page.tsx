"use client";
import Image, { type ImageProps } from "next/image";
import { Button } from "@repo/ui/button";
import styles from "./page.module.css";
import { useState } from "react";
import { redirect } from "next/navigation";

export default function Home() {
  const [roomId, setRoomId] = useState<string>("");
  return (
   <div className="flex items-center justify-center h-screen w-screen gap-4">
     <input 
       className="p-5 h-12 w-64 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" 
       type="text" 
       placeholder="    Enter Room ID"
       value={roomId} 
       onChange={(e) => setRoomId(e.target.value)} 
     />
     <button 
       className="h-[5vh] w-[10vw] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
       onClick={()=>{
         redirect(`/room/${roomId}`);
       }}
     >
       Join Room
     </button>
   </div>
  );
}