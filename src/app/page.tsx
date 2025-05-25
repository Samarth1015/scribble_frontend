"use client";

import { useState } from "react";
import { socket } from "../../client/socket";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");

  const join_room = () => {
    if (!name || name === "") {
      alert("Please enter your name!");
      return;
    }

    socket.emit("join_room_req", { name });
    router.push("/play");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-600">
          Scribbl.io
        </h1>

        <div className="space-y-6">
          <div className="relative">
            <input
              required
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your nickname"
              className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              maxLength={20}
            />
          </div>

          <button
            onClick={join_room}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 transform hover:scale-105"
          >
            Play Now!
          </button>

          <div className="text-center mt-6 space-y-2">
            <p className="text-gray-600">How to play:</p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>🎨 One player draws, others guess</li>
              <li>💭 Type your guess in the chat</li>
              <li>⭐ Score points by guessing correctly</li>
              <li>🏆 Player with most points wins!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
