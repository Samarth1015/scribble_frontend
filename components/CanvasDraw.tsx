"use client";
import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { Player } from "../types/player";

interface CanvasDrawProps {
  socket: Socket;
  playerInfo: Player | null;
  drawer: {
    name: string;
    socketId: string;
  } | null;
}

export default function CanvasDraw({
  socket,
  playerInfo,
  drawer,
}: CanvasDrawProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth * 0.6; // 60% of window width
      canvas.height = 500;
      const context = canvas.getContext("2d");
      if (context) {
        context.lineJoin = "round";
        context.lineCap = "round";
        context.lineWidth = strokeWidth;
        context.strokeStyle = strokeColor;
        setCtx(context);
      }
    }

    socket.on("draw", ({ fromX, fromY, toX, toY, color, width, erase }) => {
      if (!ctx) return;
      ctx.lineWidth = width;
      ctx.strokeStyle = erase ? "#FFFFFF" : color;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
    });

    socket.on("clear_canvas", () => {
      if (!ctx || !canvasRef.current) return;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    });
  }, [socket, ctx, strokeColor, strokeWidth]);

  const getPosition = (
    e: React.MouseEvent | React.TouchEvent,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (drawer?.socketId !== socket.id) return;
    const canvas = canvasRef.current;
    if (!canvas || !ctx) return;
    const { x, y } = getPosition(e, canvas);
    setLastPos({ x, y });
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (drawer?.socketId !== socket.id) return;
    if (!isDrawing || !ctx || !lastPos) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x, y } = getPosition(e, canvas);

    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = isEraser ? "#FFFFFF" : strokeColor;

    // Draw locally
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Emit to server
    socket.emit("draw", {
      fromX: lastPos.x,
      fromY: lastPos.y,
      toX: x,
      toY: y,
      color: strokeColor,
      width: strokeWidth,
      erase: isEraser,
      roomNo: playerInfo?.roomNo,
    });

    setLastPos({ x, y });
  };

  const stopDrawing = () => {
    if (drawer?.socketId !== socket.id) return;
    setIsDrawing(false);
    setLastPos(null);
  };

  const clearCanvas = () => {
    if (drawer?.socketId !== socket.id) return;
    if (!ctx || !canvasRef.current) return;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    socket.emit("clear_canvas", { roomNo: playerInfo?.roomNo });
  };

  return (
    <div className="flex flex-col items-center">
      {drawer?.socketId === socket.id && (
        <div className="mb-4 flex items-center gap-4 bg-white p-4 rounded-lg shadow">
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="w-10 h-10 cursor-pointer"
          />
          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            className="w-32"
          />
          <button
            onClick={() => setIsEraser(!isEraser)}
            className={`px-4 py-2 rounded ${
              isEraser ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Eraser
          </button>
          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Clear All
          </button>
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{
          border: "2px solid #ccc",
          background: "#fff",
          borderRadius: "8px",
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
}
