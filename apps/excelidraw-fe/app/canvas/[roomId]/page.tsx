import React from 'react'
import RoomCanvas from '@/components/Page/RoomCanvas'

const Page = async ({ params }: { params: Promise<{ roomId: string }> }) => {
  // Await the params Promise to get the actual values
  const { roomId } = await params;
  
  console.log("Room ID:", roomId);
  
  return (
    <div>
      <RoomCanvas roomId={roomId} />
    </div>
  )
}

export default Page