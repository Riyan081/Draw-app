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
      points: { x: number; y: number }[];
    }
  | {
      type: "line";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }|
    {
      type:"diamond";
      centerX:number;
      centerY:number;
      halfWidth:number;
      halfHeight:number;
    };

function drawShape(shape: Shape, ctx: CanvasRenderingContext2D, strokeColor: string, fillColor: string) {
  if (shape.type === "rectangle") {
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
    ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
  }
  if (shape.type === "circle") {
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
  }
  if (shape.type === "pen") {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    shape.points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.closePath();
  }
  if (shape.type === "line") {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(shape.x1, shape.y1);
    ctx.lineTo(shape.x2, shape.y2);
    ctx.stroke();
    ctx.closePath();
  }
  if (shape.type === "diamond") {
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(shape.centerX, shape.centerY - shape.halfHeight);
    ctx.lineTo(shape.centerX + shape.halfWidth, shape.centerY);
    ctx.lineTo(shape.centerX, shape.centerY + shape.halfHeight);
    ctx.lineTo(shape.centerX - shape.halfWidth, shape.centerY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

// Map of userId -> their current preview shape
const remotePreviews: Map<string, Shape> = new Map();

function clearCanvas(
  existingShapes: Shape[],
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw all saved shapes in red
  existingShapes.forEach((shape) => {
    drawShape(shape, ctx, "red", "rgba(255,0,0,0.3)");
  });

  // Draw remote users' live previews in blue (so you can tell them apart)
  remotePreviews.forEach((shape) => {
    drawShape(shape, ctx, "#4A9EFF", "rgba(74,158,255,0.2)");
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
  let redoStack: Shape[] = [];

  // Throttle helper — limits how often previews are sent (every 50ms)
  let lastPreviewSent = 0;
  const THROTTLE_MS = 50;

  socket.onmessage = (event) => {
    const parsedData = JSON.parse(event.data);

    if (parsedData.type === "chat") {
      const parsedMessage = JSON.parse(parsedData.message);
      const parsedShape = parsedMessage.shape;
      if (!parsedShape) {
        return;
      }
      // Remove this user's preview since they finished drawing
      if (parsedData.userId) {
        remotePreviews.delete(parsedData.userId);
      }
      existingShapes.push(parsedShape);
      clearCanvas(existingShapes, ctx, canvas);
    }

    // Live preview from another user
    if (parsedData.type === "draw_preview") {
      if (parsedData.shape) {
        remotePreviews.set(parsedData.userId, parsedData.shape);
      } else {
        remotePreviews.delete(parsedData.userId);
      }
      clearCanvas(existingShapes, ctx, canvas);
    }
  };

  clearCanvas(existingShapes, ctx, canvas);

  let clicked = false;
  let startX = 0;
  let startY = 0;
  let currentPoints: { x: number; y: number }[] = [];


  const undo = ()=>{
    if(existingShapes.length===0){
      return;
    }

    const removedShape = existingShapes.pop();
    if(removedShape){
      redoStack.push(removedShape);
       clearCanvas(existingShapes,ctx,canvas);
    }
  }

  const redo = ()=>{
    if(redoStack.length===0){
      return;
    }

    const restoredShape = redoStack.pop();
    if(restoredShape){
      existingShapes.push(restoredShape); 
      clearCanvas(existingShapes,ctx,canvas);

    }
  }


  const handleKeyDown = (e:KeyboardEvent)=>{
    const isCtrl = e.ctrlKey || e.metaKey;

    if(isCtrl && e.key ==="z" || isCtrl && e.key==="Z"){
      e.preventDefault();
      undo();
    }

    if(isCtrl && e.key==="y" || isCtrl && (e.key==="Y")){
      e.preventDefault();
      redo();
    }
  }




  const handleMouseDown = (e: MouseEvent) => {
    clicked = true;
    startX = e.clientX;
    startY = e.clientY;
    //  @ts-ignore
    if (window.selectedShape === "pen") {
      currentPoints = [{ x: startX, y: startY }];
    }
  };



  const handleMouseUp = (e: MouseEvent) => {
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
    } else if (selectedShape === "pen") {
      shape = {
        type: "pen",
        points: currentPoints,
      };
      currentPoints = [];
    } else if (selectedShape === "line") {
      shape = {
        type: "line",
        x1: startX,
        y1: startY,
        x2: e.clientX,
        y2: e.clientY,
      };
    } else if(selectedShape==="diamond"){
      const centerX = startX + width/2;
      const centerY = startY + height/2;
      const halfWidth = Math.abs(width)/2;
      const halfHeight = Math.abs(height)/2;
      shape={
        type:"diamond",
        centerX,
        centerY,
        halfWidth:halfWidth,
        halfHeight:halfHeight
      };
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

    redoStack = []
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (clicked) {
      const width = e.clientX - startX;
      const height = e.clientY - startY;

      // @ts-ignore
      const selectedShape = window.selectedShape;

      // Build the preview shape
      let previewShape: Shape | null = null;

      if (selectedShape === "pen") {
        currentPoints.push({ x: e.clientX, y: e.clientY });
        previewShape = { type: "pen", points: [...currentPoints] };
      } else if (selectedShape === "rectangle") {
        previewShape = { type: "rectangle", x: startX, y: startY, width, height };
      } else if (selectedShape === "circle") {
        const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
        previewShape = { type: "circle", centerX: startX + width / 2, centerY: startY + height / 2, radius };
      } else if (selectedShape === "line") {
        previewShape = { type: "line", x1: startX, y1: startY, x2: e.clientX, y2: e.clientY };
      } else if (selectedShape === "diamond") {
        previewShape = {
          type: "diamond",
          centerX: startX + width / 2,
          centerY: startY + height / 2,
          halfWidth: Math.abs(width) / 2,
          halfHeight: Math.abs(height) / 2,
        };
      }

      // Redraw canvas with existing shapes + local preview
      clearCanvas(existingShapes, ctx, canvas);
      if (previewShape) {
        drawShape(previewShape, ctx, "red", "rgba(255,0,0,0.3)");

        // Send preview to other users (throttled)
        const now = Date.now();
        if (now - lastPreviewSent > THROTTLE_MS) {
          lastPreviewSent = now;
          socket.send(JSON.stringify({
            type: "draw_preview",
            roomId: roomId,
            shape: previewShape,
          }));
        }
      }
    }
  };

  window.addEventListener("keydown",handleKeyDown);

  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("mousemove", handleMouseMove);

  return () => {
    window.removeEventListener("keydown",handleKeyDown);
    canvas.removeEventListener("mousedown", handleMouseDown);
    canvas.removeEventListener("mouseup", handleMouseUp);
    canvas.removeEventListener("mousemove", handleMouseMove);
  };
}
