"use client";

import { useEffect, useState } from "react";
import { socket } from "../../../client/socket";
import CanvasDraw from "../../../components/CanvasDraw";
import { Player } from "../../../types/player";

interface ChatMessage {
  name: string;
  message: string;
}

export default function Play() {
  const [messages, setMessages] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [playerInfo, setPlayerInfo] = useState<Player | null>(null);

  useEffect(() => {
    console.log("play page -->", socket.id);

    const handleJoin = (msg: {
      roomNo: string;
      name: string;
      socketId: string;
    }) => {
      console.log(msg.socketId);
      if (socket.id == msg.socketId) {
        setPlayerInfo({ name: msg.name, roomNo: Number(msg.roomNo) });
      }
      setMessages((prev) => [...prev, `${msg.name} joined room ${msg.roomNo}`]);
    };

    const handleLeave = (msg: { roomNo: string; name: string }) => {
      setMessages((prev) => [...prev, `${msg.name} left room ${msg.roomNo}`]);
    };

    const handleChat = (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
    };

    socket.on("res_join_room_req", handleJoin);
    socket.on("player_left", handleLeave);
    socket.on("chat_message", handleChat);

    return () => {
      socket.off("res_join_room_req", handleJoin);
      socket.off("player_left", handleLeave);
      socket.off("chat_message", handleChat);
    };
  }, []);

  const sendChatMessage = () => {
    if (!chatInput.trim() || !playerInfo) return;

    const chatMsg: ChatMessage & { roomNo: number } = {
      name: playerInfo.name,
      message: chatInput.trim(),
      roomNo: playerInfo.roomNo,
    };

    socket.emit("chat_message", chatMsg);
    setChatInput("");
  };

  return (
    <div className="flex flex-col items-center p-4 min-h-screen bg-gray-100 text-black">
      <h1 className="text-2xl font-bold mb-4">Scribble Room</h1>

      {/* Player Info */}
      {playerInfo && (
        <div className="mb-4">
          <h2 className="text-lg">Player: {playerInfo.name}</h2>
          <h3 className="text-md text-gray-600">Room: {playerInfo.roomNo}</h3>
        </div>
      )}

      {/* Join/Leave System Messages */}
      <div className="w-full max-w-xl mb-4 space-y-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-3 rounded shadow-sm"
          >
            {msg}
          </div>
        ))}
      </div>

      {/* Chat Box */}
      <div className="w-full max-w-xl mb-4">
        <div className="h-40 overflow-y-auto bg-white p-3 rounded shadow-sm border border-gray-300 mb-2">
          {chatMessages.map((msg, index) => (
            <div key={index} className="text-sm text-gray-800">
              <span className="font-semibold">{msg.name}:</span> {msg.message}
            </div>
          ))}
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
            placeholder="Type a message..."
            className="flex-grow p-2 border rounded"
          />
          <button
            onClick={sendChatMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Send
          </button>
        </div>
      </div>

      <CanvasDraw playerInfo={playerInfo} socket={socket}></CanvasDraw>
    </div>
  );
}
