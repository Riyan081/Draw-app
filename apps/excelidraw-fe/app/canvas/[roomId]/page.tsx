
import React from 'react'
import RoomCanvas from '@/components/Page/RoomCanvas'
const page =async ({params}:{params:{roomId:string}}) => {
   const roomId = params.roomId
  return (
    <div>
      
      <RoomCanvas roomId={roomId} />
    </div>  
    
  )
}

export default page