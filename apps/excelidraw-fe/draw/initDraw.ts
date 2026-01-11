import axios from "axios";
import { HTTP_BACKEND } from "@/lib/config";

// Throttle function to limit how often a function can be called
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function throttle<T extends (...args: any[]) => void>(func: T, limit: number): T {
  let inThrottle = false;
  return function(this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  } as T;
}

// Generate a unique user ID for this session
const sessionUserId = Math.random().toString(36).substring(2, 15);

// Generate random colors for cursors
const cursorColors = [
  "#f43f5e", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", 
  "#ec4899", "#06b6d4", "#84cc16", "#6366f1", "#14b8a6"
];
const sessionColor = cursorColors[Math.floor(Math.random() * cursorColors.length)];

// Generate a random username for this session
const adjectives = ["Swift", "Clever", "Brave", "Calm", "Eager", "Gentle", "Happy", "Jolly", "Kind", "Lively"];
const animals = ["Panda", "Tiger", "Eagle", "Dolphin", "Fox", "Wolf", "Bear", "Owl", "Hawk", "Lion"];
const sessionUsername = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${animals[Math.floor(Math.random() * animals.length)]}`;

// Type for remote cursor
interface RemoteCursor {
  x: number;
  y: number;
  username: string;
  color: string;
  lastUpdate: number;
}

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
      ctx.arc(
        shape.centerX,
        shape.centerY,
        Math.abs(shape.radius),
        0,
        2 * Math.PI
      );
      ctx.fill();
      ctx.stroke();
      ctx.closePath();
    }

    if (shape.type === "pen") {
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.beginPath();
      shape.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
      ctx.closePath();
    }
    if (shape.type == "line") {
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(shape.x1, shape.y1);
      ctx.lineTo(shape.x2, shape.y2);
      ctx.stroke();
      ctx.closePath();
    } 
    if(shape.type==="diamond"){
      ctx.strokeStyle="red";
      ctx.fillStyle="rgba(255,0,0,0.3)";
      ctx.beginPath();
      ctx.moveTo(shape.centerX,shape.centerY - shape.halfHeight);
      ctx.lineTo(shape.centerX + shape.halfWidth, shape.centerY);
      ctx.lineTo(shape.centerX, shape.centerY + shape.halfHeight);
      ctx.lineTo(shape.centerX - shape.halfWidth, shape.centerY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  });
}

// Draw in-progress shapes with a different style (blue, semi-transparent)
function drawInProgressShape(shape: Shape, ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "#3b82f6"; // Blue color for other users
  ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]); // Dashed line to indicate "in progress"

  if (shape.type === "rectangle") {
    ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
    ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
  } else if (shape.type === "circle") {
    ctx.beginPath();
    ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
  } else if (shape.type === "pen") {
    ctx.beginPath();
    shape.points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
    ctx.closePath();
  } else if (shape.type === "line") {
    ctx.beginPath();
    ctx.moveTo(shape.x1, shape.y1);
    ctx.lineTo(shape.x2, shape.y2);
    ctx.stroke();
    ctx.closePath();
  } else if (shape.type === "diamond") {
    ctx.beginPath();
    ctx.moveTo(shape.centerX, shape.centerY - shape.halfHeight);
    ctx.lineTo(shape.centerX + shape.halfWidth, shape.centerY);
    ctx.lineTo(shape.centerX, shape.centerY + shape.halfHeight);
    ctx.lineTo(shape.centerX - shape.halfWidth, shape.centerY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.setLineDash([]); // Reset to solid line
}

// Draw remote cursor with username label
function drawRemoteCursor(cursor: RemoteCursor, ctx: CanvasRenderingContext2D) {
  const { x, y, username, color } = cursor;
  
  ctx.save();
  
  // Draw cursor arrow
  ctx.fillStyle = color;
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;
  
  ctx.beginPath();
  // Cursor arrow shape
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + 18);
  ctx.lineTo(x + 5, y + 14);
  ctx.lineTo(x + 10, y + 22);
  ctx.lineTo(x + 13, y + 20);
  ctx.lineTo(x + 8, y + 12);
  ctx.lineTo(x + 14, y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Draw username label with background
  const padding = 4;
  ctx.font = "12px Inter, sans-serif";
  const textWidth = ctx.measureText(username).width;
  
  // Label background
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x + 16, y + 8, textWidth + padding * 2, 20, 4);
  ctx.fill();
  
  // Label text
  ctx.fillStyle = "white";
  ctx.fillText(username, x + 16 + padding, y + 22);
  
  ctx.restore();
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
  
  // Track in-progress shapes from other users (keyed by oduserId)
  const inProgressShapes: Map<string, Shape> = new Map();
  
  // Track remote cursors from other users
  const remoteCursors: Map<string, RemoteCursor> = new Map();

  // Helper function to render everything including in-progress shapes and cursors
  const renderAll = () => {
    clearCanvas(existingShapes, ctx, canvas);
    // Draw in-progress shapes from other users with different style
    inProgressShapes.forEach((shape) => {
      drawInProgressShape(shape, ctx);
    });
    // Draw remote cursors
    remoteCursors.forEach((cursor) => {
      drawRemoteCursor(cursor, ctx);
    });
  };

  // Clean up stale cursors (users who left or disconnected)
  const cleanupStaleCursors = () => {
    const now = Date.now();
    remoteCursors.forEach((cursor, oduserId) => {
      if (now - cursor.lastUpdate > 5000) { // 5 seconds timeout
        remoteCursors.delete(oduserId);
      }
    });
  };
  const cursorCleanupInterval = setInterval(cleanupStaleCursors, 2000);

  socket.onmessage = (event) => {
    const parsedData = JSON.parse(event.data);

    // Handle completed shapes (saved to DB)
    if (parsedData.type === "chat") {
      const parsedMessage = JSON.parse(parsedData.message);
      const parsedShape = parsedMessage.shape;
      if (!parsedShape) {
        return;
      }
      // Remove from in-progress when complete
      if (parsedData.sessionUserId) {
        inProgressShapes.delete(parsedData.sessionUserId);
      }
      existingShapes.push(parsedShape);
      renderAll();
    }

    // Handle live drawing progress from other users
    if (parsedData.type === "drawing_progress") {
      const oduserId = parsedData.sessionUserId;
      // Don't render our own in-progress (we already see it locally)
      if (oduserId === sessionUserId) return;
      
      const shape = parsedData.shape;
      if (shape) {
        inProgressShapes.set(oduserId, shape);
        renderAll();
      }
    }

    // Handle drawing complete - clear in-progress for that user
    if (parsedData.type === "drawing_complete") {
      const oduserId = parsedData.sessionUserId;
      if (oduserId !== sessionUserId) {
        inProgressShapes.delete(oduserId);
        renderAll();
      }
    }

    // Handle cursor movements from other users
    if (parsedData.type === "cursor_move") {
      const oduserId = parsedData.sessionUserId;
      if (oduserId !== sessionUserId) {
        remoteCursors.set(oduserId, {
          x: parsedData.x,
          y: parsedData.y,
          username: parsedData.username,
          color: parsedData.color,
          lastUpdate: Date.now()
        });
        renderAll();
      }
    }

    // Handle user leaving
    if (parsedData.type === "user_left") {
      const oduserId = parsedData.sessionUserId;
      remoteCursors.delete(oduserId);
      inProgressShapes.delete(oduserId);
      renderAll();
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

    // Send completed shape
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "chat",
          roomId: roomId,
          message: JSON.stringify({ shape }),
          sessionUserId: sessionUserId,
        })
      );

      // Notify others that drawing is complete
      socket.send(
        JSON.stringify({
          type: "drawing_complete",
          roomId: roomId,
          sessionUserId: sessionUserId,
        })
      );
    }

    redoStack = []
  };

  // Throttled function to send drawing progress
  const sendDrawingProgress = throttle((shape: Shape) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "drawing_progress",
          roomId: roomId,
          shape: shape,
          sessionUserId: sessionUserId,
        })
      );
    }
  }, 30); // Send at most every 30ms

  // Throttled function to send cursor position
  const sendCursorPosition = throttle((x: number, y: number) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "cursor_move",
          roomId: roomId,
          sessionUserId: sessionUserId,
          x: x,
          y: y,
          username: sessionUsername,
          color: sessionColor,
        })
      );
    }
  }, 50); // Send at most every 50ms

  const handleMouseMove = (e: MouseEvent) => {
    // Always send cursor position (even when not drawing)
    sendCursorPosition(e.clientX, e.clientY);

    if (clicked) {
      const width = e.clientX - startX;
      const height = e.clientY - startY;

      clearCanvas(existingShapes, ctx, canvas);
      // Also draw in-progress shapes from other users
      inProgressShapes.forEach((shape) => {
        drawInProgressShape(shape, ctx);
      });
      // Also draw remote cursors
      remoteCursors.forEach((cursor) => {
        drawRemoteCursor(cursor, ctx);
      });
      ctx.strokeStyle = "red";
      ctx.fillStyle = "rgba(255,0,0,0.3)";

      // @ts-ignore
      const selectedShape = window.selectedShape;
      if (selectedShape === "rectangle") {
        ctx.fillRect(startX, startY, width, height);
        ctx.strokeRect(startX, startY, width, height);        // Send live progress
        sendDrawingProgress({
          type: "rectangle",
          x: startX,
          y: startY,
          width: width,
          height: height,
        });      } else if (selectedShape === "circle") {
        // FIX: Match the logic from mouseup exactly
        const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
        const centerX = startX + width / 2;
        const centerY = startY + height / 2;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
        // Send live progress
        sendDrawingProgress({
          type: "circle",
          centerX: centerX,
          centerY: centerY,
          radius: radius,
        });
      } else if (selectedShape === "pen") {
        currentPoints.push({ x: e.clientX, y: e.clientY });
        ctx.beginPath();
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        currentPoints.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
        ctx.closePath();
        // Send live progress
        sendDrawingProgress({
          type: "pen",
          points: [...currentPoints], // Copy array
        });
      } else if (selectedShape === "line") {
        ctx.beginPath();
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.moveTo(startX, startY);
        ctx.lineTo(e.clientX, e.clientY);
        ctx.stroke();
        ctx.closePath();
        // Send live progress
        sendDrawingProgress({
          type: "line",
          x1: startX,
          y1: startY,
          x2: e.clientX,
          y2: e.clientY,
        });
      } else if(selectedShape==="diamond"){
        const centerX = startX + width/2;
        const centerY = startY + height/2;
        const halfWidth = Math.abs(width)/2;
        const halfHeight = Math.abs(height)/2;
        ctx.beginPath();
        ctx.moveTo(centerX,centerY-halfHeight);
        ctx.lineTo(centerX+halfWidth,centerY);
        ctx.lineTo(centerX,centerY+halfHeight);
        ctx.lineTo(centerX-halfWidth,centerY);
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Send live progress
        sendDrawingProgress({
          type: "diamond",
          centerX: centerX,
          centerY: centerY,
          halfWidth: halfWidth,
          halfHeight: halfHeight,
        });
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
    clearInterval(cursorCleanupInterval);
    
    // Notify others that we're leaving
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "user_left",
        roomId: roomId,
        sessionUserId: sessionUserId
      }));
    }
  };
}
