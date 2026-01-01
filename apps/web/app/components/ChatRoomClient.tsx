"use client";
import { useSocket } from "../hooks/useSocket";
import { useEffect, useState } from "react";

import React from "react";

export function ChatRoomClient({
  messages,
  id,
}: {
  messages: { message: string }[];
  id: string;
}) {
  const { socket, loading } = useSocket();
  const [chats, setChats] = useState(messages);
  const [currentMessage, setCurrentMessage] = useState("");

  useEffect(() => {
    if (!loading && socket) {
      socket.send(
        JSON.stringify({
          type: "join_room",
          roomId: id,
        })
      );

      socket.onmessage = (event) => {
        const parsedData = JSON.parse(event.data);
        if (parsedData.type === "chat") {
          setChats((prev) => [...prev, parsedData.message]);
        }
        


      };
    }
  }, [loading, socket, id]);

  return(
    <div>
        {chats.map((m,index)=>(
            <div key={index}>{m.message}</div>
        ))}

        <input type="text" value={currentMessage} onChange={(e)=>setCurrentMessage(e.target.value)} />
        <button onClick={()=>{
            if(socket){
                socket.send(JSON.stringify({
                    type:"chat",
                    roomId: id,
                    message: currentMessage
                }))
                setCurrentMessage("");
                
            }
        }}>Send</button>
    </div>
  )


}



