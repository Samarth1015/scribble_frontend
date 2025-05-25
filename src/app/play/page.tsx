<<<<<<< HEAD
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
  const [playerInfo, setPlayerInfo] = useState<
    (Player & { socketId: string }) | null
  >(null);
  const [wordToBeChoosen, setWordToBeChoosen] = useState<string[] | null>(null);
  const [gameWord, setGameWord] = useState<string | null>(null);
  const [playerPoints, setPlayerPoints] = useState<Map<string, number>>(
    new Map()
  );
  const gameWordRef = useRef<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [drawer, setDrawer] = useState<{
    name: string;
    socketId: string;
  } | null>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    console.log("play page -->", socket.id);

    const handleJoin = (msg: {
      roomNo: string;
      name: string;
      socketId: string;
    }) => {
      if (socket.id == msg.socketId) {
        setPlayerInfo({
          name: msg.name,
          roomNo: Number(msg.roomNo),
          socketId: msg.socketId,
        });
      }
      setMessages((prev) => [...prev, `${msg.name} joined room ${msg.roomNo}`]);
    };

    const handleLeave = (msg: { roomNo: string; name: string }) => {
      setMessages((prev) => [...prev, `${msg.name} left room ${msg.roomNo}`]);
    };

    const handleChat = (msg: ChatMessage) => {
      if (gameWordRef.current && msg.name !== drawer?.name) {
        const normalizedMsg = msg.message.trim().toLowerCase();
        const normalizedGameWord = gameWordRef.current.trim().toLowerCase();
        msg.isCorrect = normalizedMsg === normalizedGameWord;
      }
      setChatMessages((prev) => [...prev, msg]);
    };

    socket.on("game_over", (data: { points: { [key: string]: number } }) => {
      setPlayerPoints(new Map(Object.entries(data.points)));
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
    if (!chatInput.trim() || !playerInfo) return;

    const chatMsg = {
      name: playerInfo.name,
      message: chatInput.trim(),
      roomNo: playerInfo.roomNo,
      isCorrect: chatInput.trim() === gameWordRef.current?.trim(),
    };

    socket.emit("chat_message", chatMsg);
    setChatInput("");
  };

  return (
    <div className="min-h-screen text-black bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Sidebar - Player Info & Points */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Players</h2>
            {playerInfo?.name} <br />
            {playerInfo?.roomNo} <br />
            {playerInfo?.socketId}
          </div>
        </div>

        {/* Main Content - Canvas & Game Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Game Status */}
          <div className="bg-white rounded-lg shadow p-4 text-center">
            {drawer && (
              <div className="text-lg">
                <span className="font-bold text-blue-600">{drawer.name}</span>
                {drawer.socketId === socket.id ? (
                  <span> - It&apos;s your turn to draw!</span>
                ) : (
                  <span> is drawing...</span>
                )}
              </div>
            )}

            {/* Word Selection */}
            {wordToBeChoosen && drawer?.socketId === socket.id && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Choose a word:</h3>
                <div className="flex gap-2 justify-center">
                  {wordToBeChoosen.map((word, idx) => (
                    <button
                      key={idx}
                      className="bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded-lg shadow transition-colors"
                      onClick={() => {
                        if (playerInfo) {
                          socket.emit("word_chosen", {
                            word,
                            roomNo: playerInfo.roomNo,
                          });
                          setWordToBeChoosen(null);
                        }
                      }}
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Canvas */}
          <CanvasDraw playerInfo={playerInfo} socket={socket} drawer={drawer} />
        </div>

        {/* Right Sidebar - Chat */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow p-4 h-[600px] flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Chat</h2>

            {/* System Messages */}
            <div className="mb-4">
              {messages.map((msg, index) => (
                <div key={index} className="text-sm text-gray-500 italic mb-1">
                  {msg}
                </div>
              ))}
            </div>

            {/* Chat Messages */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto mb-4 space-y-2"
            >
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-2 rounded ${
                    msg.isCorrect
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100"
                  }`}
                >
                  <span className="font-semibold">{msg.name}: </span>
                  {msg.isCorrect ? "🎉 Correct!" : msg.message}
                </div>
              ))}
            </div>

            {/* Chat Input */}
            {drawer?.socketId !== socket.id && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                  placeholder="Type your guess..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendChatMessage}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
=======
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
  const [playerPoints, setPlayerPoints] = useState<Map<string, number>>(new Map());
  const gameWordRef = useRef<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [drawer, setDrawer] = useState<{
    name: string;
    socketId: string;
  } | null>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    console.log("play page -->", socket.id);

    const handleJoin = (msg: {
      roomNo: string;
      name: string;
      socketId: string;
    }) => {
      if (socket.id == msg.socketId) {
        setPlayerInfo({ name: msg.name, roomNo: Number(msg.roomNo) });
      }
      setMessages((prev) => [...prev, `${msg.name} joined room ${msg.roomNo}`]);
    };

    const handleLeave = (msg: { roomNo: string; name: string }) => {
      setMessages((prev) => [...prev, `${msg.name} left room ${msg.roomNo}`]);
    };

    const handleChat = (msg: ChatMessage) => {
      if (gameWordRef.current && msg.name !== drawer?.name) {
        const normalizedMsg = msg.message.trim().toLowerCase();
        const normalizedGameWord = gameWordRef.current.trim().toLowerCase();
        msg.isCorrect = normalizedMsg === normalizedGameWord;
      }
      setChatMessages((prev) => [...prev, msg]);
    };

    socket.on("game_over", (data: { points: { [key: string]: number } }) => {
      setPlayerPoints(new Map(Object.entries(data.points)));
      setWordToBeChoosen(null);
      setGameWord(null);
      gameWordRef.current = null;
      setDrawer(null);
      setChatMessages([]);
      setMessages((prev) => [...prev, "Game Over! Starting new game..."]);
    });

    socket.on("points_update", (data: { points: { [key: string]: number } }) => {
      setPlayerPoints(new Map(Object.entries(data.points)));
    });

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
    if (!chatInput.trim() || !playerInfo) return;
    
    const chatMsg = {
      name: playerInfo.name,
      message: chatInput.trim(),
      roomNo: playerInfo.roomNo,
      isCorrect: chatInput.trim() === gameWordRef.current?.trim()
    };
    
    socket.emit("chat_message", chatMsg);
    setChatInput("");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Sidebar - Player Info & Points */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Players</h2>
            {Array.from(playerPoints.entries()).map(([socketId, points]) => (
              <div key={socketId} className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">
                  {socketId === playerInfo?.socketId ? "You" : "Player"}
                </span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  {points} pts
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content - Canvas & Game Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Game Status */}
          <div className="bg-white rounded-lg shadow p-4 text-center">
            {drawer && (
              <div className="text-lg">
                <span className="font-bold text-blue-600">{drawer.name}</span>
                {drawer.socketId === socket.id ? (
                  <span> - It's your turn to draw!</span>
                ) : (
                  <span> is drawing...</span>
                )}
              </div>
            )}
            
            {/* Word Selection */}
            {wordToBeChoosen && drawer?.socketId === socket.id && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Choose a word:</h3>
                <div className="flex gap-2 justify-center">
                  {wordToBeChoosen.map((word, idx) => (
                    <button
                      key={idx}
                      className="bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded-lg shadow transition-colors"
                      onClick={() => {
                        if (playerInfo) {
                          socket.emit("word_chosen", {
                            word,
                            roomNo: playerInfo.roomNo,
                          });
                          setWordToBeChoosen(null);
                        }
                      }}
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Canvas */}
          <CanvasDraw
            playerInfo={playerInfo}
            socket={socket}
            drawer={drawer}
          />
        </div>

        {/* Right Sidebar - Chat */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow p-4 h-[600px] flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Chat</h2>
            
            {/* System Messages */}
            <div className="mb-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className="text-sm text-gray-500 italic mb-1"
                >
                  {msg}
                </div>
              ))}
            </div>

            {/* Chat Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto mb-4 space-y-2"
            >
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-2 rounded ${
                    msg.isCorrect
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100"
                  }`}
                >
                  <span className="font-semibold">{msg.name}: </span>
                  {msg.isCorrect ? "🎉 Correct!" : msg.message}
                </div>
              ))}
            </div>

            {/* Chat Input */}
            {drawer?.socketId !== socket.id && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                  placeholder="Type your guess..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendChatMessage}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
>>>>>>> e8a70b761a388a5c2896ca5a78c164ae8ae416a7
