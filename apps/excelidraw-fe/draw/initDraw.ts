import axios from "axios";
import { HTTP_BACKEND } from "@/lib/config";

type Shape =
  | {
      type: "rectangle";
      x: number;
      y: number;
      height: number;
      width: number;
    }
  | {
      type: "circle";
      centerX: number;
      centerY: number;
      radius: number;
    }
  | {
      type: "pen";
      points:{x:number,y:number}[];
    };

function clearCanvas(
  existingShapes: Shape[],
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  existingShapes.map((shape) => {
    if (shape.type === "rectangle") {
      ctx.strokeStyle = "red";
      ctx.fillStyle = "rgba(255,0,0,0.3)";
      ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    }

    if (shape.type === "circle") {
      ctx.strokeStyle = "red";
      ctx.fillStyle = "rgba(255,0,0,0.3)";
      ctx.beginPath();
      ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.closePath();
    }

    if(shape.type ==="pen"){
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.beginPath();
      shape.points.forEach((point,index)=>{
        if(index===0){
          ctx.moveTo(point.x,point.y);
        }else{
          ctx.lineTo(point.x,point.y);
        }
      })
      ctx.stroke();
      ctx.closePath();

    }
  });
}

async function getExistingShapes(roomId: string) {
  const res = await axios.get(`${HTTP_BACKEND}/user/chats/${roomId}`);
  const messages = res.data.messages;
  const shapes = messages.map((x: { message: string }) => {
    const messageData = JSON.parse(x.message);
    return messageData.shape;
  });
  console.log("Existing Shapes: ", shapes);

  return shapes;
}

export async function initDraw(
  canvas: HTMLCanvasElement,
  roomId: string,
  socket: WebSocket
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const existingShapes: Shape[] = await getExistingShapes(roomId);

  socket.onmessage = (event) => {
    const parsedData = JSON.parse(event.data);

    if (parsedData.type === "chat") {
      const parsedMessage = JSON.parse(parsedData.message);
      const parsedShape = parsedMessage.shape;
      if (!parsedShape) {
        return;
      }
      existingShapes.push(parsedShape);
      clearCanvas(existingShapes, ctx, canvas);
    }
  };

  clearCanvas(existingShapes, ctx, canvas);

  let clicked = false;
  let startX = 0;
  let startY = 0;
  let currentPoints: {x:number,y:number}[] = [];

  const handleMouseDown = (e:MouseEvent)=> {
    clicked = true;
    startX = e.clientX;
    startY = e.clientY;
    if(window.selectedShape === "pen"){
      currentPoints = [{x:startX,y:startY}];
    }
  };


  

  const handleMouseUp =(e:MouseEvent)=> {
    clicked = false;
    console.log("Mouse Up at ", e.clientX, e.clientY);
    const height = e.clientY - startY;
    const width = e.clientX - startX;
    // @ts-ignore
    const selectedShape = window.selectedShape;
    let shape: Shape | null = null;

    if (selectedShape === "rectangle") {
      shape = {
        type: "rectangle",
        x: startX,
        y: startY,
        width: width,
        height: height,
      };
    } else if (selectedShape === "circle") {
      // FIX: Use Math.abs() so dragging Left/Up works
      const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
      shape = {
        type: "circle",
        centerX: startX + width / 2, // Center is the midpoint of the drag
        centerY: startY + height / 2,
        radius: radius,
      };
    } else if(selectedShape ==="pen"){
      shape = {
        type:"pen",
        points:currentPoints
      }
      currentPoints = []

    }

    if (!shape) {
      return;
    }
    existingShapes.push(shape);

    socket.send(
      JSON.stringify({
        type: "chat",
        roomId: roomId,
        message: JSON.stringify({ shape }),
      })
    );
  };

 const handleMouseMove =(e:MouseEvent)=> {
    if (clicked) {
      const width = e.clientX - startX;
      const height = e.clientY - startY;

      clearCanvas(existingShapes, ctx, canvas);
      ctx.strokeStyle = "red";
      ctx.fillStyle = "rgba(255,0,0,0.3)";

      // @ts-ignore
      const selectedShape = window.selectedShape;
      if (selectedShape === "rectangle") {
        ctx.fillRect(startX, startY, width, height);
        ctx.strokeRect(startX, startY, width, height);
      } else if (selectedShape === "circle") {
        // FIX: Match the logic from mouseup exactly
        const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
        const centerX = startX + width / 2;
        const centerY = startY + height / 2;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
      } else if(selectedShape === "pen"){
        currentPoints.push({x:e.clientX,y:e.clientY});
        ctx.beginPath();
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        currentPoints.forEach((point,index)=>{
          if(index===0){
            ctx.moveTo(point.x,point.y);
          }else{
            ctx.lineTo(point.x,point.y);
          }
        })
        ctx.stroke()
        ctx.closePath()

        
        
      }
    }
  };

  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("mousemove", handleMouseMove);


  return () => {
    canvas.removeEventListener("mousedown", handleMouseDown);
    canvas.removeEventListener("mouseup", handleMouseUp);
    canvas.removeEventListener("mousemove", handleMouseMove);
  };
}