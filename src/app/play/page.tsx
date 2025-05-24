// E:\scribble_frontend\src\app\play\page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { socket } from "../../../client/socket";
import CanvasDraw from "../../../components/CanvasDraw";
import { Player } from "../../../types/player";

interface ChatMessage {
  name: string;
  message: string;
  isCorrect?: boolean;
}

export default function Play() {
  const [messages, setMessages] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [playerInfo, setPlayerInfo] = useState<Player | null>(null);
  const [wordToBeChoosen, setWordToBeChoosen] = useState<string[] | null>(null);
  const [gameWord, setGameWord] = useState<string | null>(null);
  const [playerPoints, setPlayerPoints] = useState<Map<string, number>>(
    new Map()
  );
  const gameWordRef = useRef<string | null>(null);

  const [drawer, setDrawer] = useState<{
    name: string;
    socketId: string;
  } | null>(null);

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
      console.log("Current game word:", gameWordRef.current);

      if (gameWordRef.current && msg.name !== drawer?.name) {
        const normalizedMsg = msg.message.trim().toLowerCase();
        const normalizedGameWord = gameWordRef.current.trim().toLowerCase();

        msg.isCorrect = normalizedMsg === normalizedGameWord;
      }

      setChatMessages((prev) => [...prev, msg]);
    };

    socket.on("game_over", (data: { points: { [key: string]: number } }) => {
      console.log("game over", data.points);
      setPlayerPoints(new Map(Object.entries(data.points)));
      // Reset all game state
      setWordToBeChoosen(null);
      setGameWord(null);
      gameWordRef.current = null;
      setDrawer(null);
      setChatMessages([]);
      setMessages((prev) => [...prev, "Game Over! Starting new game..."]);
    });

    socket.on(
      "points_update",
      (data: { points: { [key: string]: number } }) => {
        setPlayerPoints(new Map(Object.entries(data.points)));
      }
    );

    socket.on("res_join_room_req", handleJoin);
    socket.on("player_left", handleLeave);
    socket.on("chat_message", handleChat);
    socket.on("choose_word", ({ words }) => {
      setWordToBeChoosen(words);
    });
    socket.on("game_ready", ({ drawer, sockeId }) => {
      setDrawer({ name: drawer, socketId: sockeId });
    });

    socket.on("round_started", (word: { word: string }) => {
      setGameWord(word.word);
      gameWordRef.current = word.word;
    });

    return () => {
      socket.off("res_join_room_req", handleJoin);
      socket.off("player_left", handleLeave);
      socket.off("chat_message", handleChat);
    };
  }, []);

  const sendChatMessage = () => {
    let chatMsg: ChatMessage & { roomNo: number };
    if (!chatInput.trim() || !playerInfo) return;
    if (chatInput.trim() === gameWordRef.current?.trim()) {
      chatMsg = {
        name: playerInfo.name,
        message: chatInput.trim(),
        roomNo: playerInfo.roomNo,
        isCorrect: true,
      };
    } else {
      chatMsg = {
        name: playerInfo.name,
        message: chatInput.trim(),
        roomNo: playerInfo.roomNo,
        isCorrect: false,
      };
    }
    socket.emit("chat_message", chatMsg);

    setChatInput("");
  };

  return (
    <div className="flex flex-col items-center p-4 min-h-screen bg-gray-100 text-black">
      {/* Points Display */}
      <div className="w-full max-w-xl mb-4">
        <h2 className="text-lg font-semibold mb-2">Points:</h2>
        <div className="bg-white p-3 rounded shadow-sm border border-gray-300">
          {Array.from(playerPoints.entries()).map(([socketId, points]) => (
            <div
              key={socketId}
              className="flex justify-between items-center py-1"
            >
              <span className="font-medium">
                {socketId === playerInfo?.socketId ? "You" : "Player"}
              </span>
              <span className="text-blue-600 font-bold">{points}</span>
            </div>
          ))}
        </div>
      </div>

      {drawer && (
        <>
          <h1>{drawer.name} is choosing a word to draw </h1>
          {/* <h1>{drawer.socketId}</h1> */}
        </>
      )}
      <h1 className="text-2xl font-bold mb-4">Scribble Room</h1>
      {wordToBeChoosen && drawer?.socketId === socket.id && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Choose a word:</h2>
          <div className="flex gap-2 flex-wrap">
            {wordToBeChoosen.map((word, idx) => (
              <button
                key={idx}
                className="bg-yellow-300 hover:bg-yellow-400 px-4 py-2 rounded shadow"
                onClick={() => {
                  if (playerInfo) {
                    socket.emit("word_chosen", {
                      word,
                      roomNo: playerInfo.roomNo,
                    });
                    setWordToBeChoosen(null); // Hide words after choosing
                  }
                }}
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}

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
              {msg.isCorrect === true && (
                <span className="text-green-600 font-bold ml-2">
                  {" "}
                  <span className="font-semibold">{msg.name}:</span> ✅
                </span>
              )}
              {msg.isCorrect === false && (
                <span className="text-red-500 font-bold ml-2">
                  {" "}
                  <span className="font-semibold">{msg.name}:</span>{" "}
                  {msg.message}❌
                </span>
              )}
            </div>
          ))}
        </div>
        {drawer?.socketId == socket.id ? (
          <></>
        ) : (
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
        )}
      </div>
      <CanvasDraw
        playerInfo={playerInfo}
        socket={socket}
        drawer={drawer}
      ></CanvasDraw>
    </div>
  );
}
