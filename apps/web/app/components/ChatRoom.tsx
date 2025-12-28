import React from 'react'
import { BACKEND_URL } from '../config';
import axios from 'axios';
import { ChatRoomClient } from './ChatRoomClient';

async function getChats(roomId:string){
    const res = await axios.get(`${BACKEND_URL}/user/chats/${roomId}`);
    return res.data.messages;
}



const ChatRoom = async ({id}:{id: string}) => {
    const messages = await getChats(id);
  return (
    <ChatRoomClient id={id} messages={messages} />
  )
}

export default ChatRoom