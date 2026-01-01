import React from 'react'
import { BACKEND_URL } from '../../config';
import axios from 'axios';
import ChatRoom from '../../components/ChatRoom';

async function fetchRoomData(slug:string){
  const res = await axios.get(`${BACKEND_URL}/user/room/${slug}`);
  return res.data;
}

const page = async({params}: {params: {slug: string}}) => {
  const slug = await params.slug
  const roomData = await fetchRoomData(slug);
  console.log(roomData);
  const chatRoomElement = await ChatRoom({ id: roomData.room.id });
  return chatRoomElement;
}

export default page