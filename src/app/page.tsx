"use client";

import { useState } from "react";
import { socket } from "../../client/socket";
import { useRouter } from "next/navigation";

// import { useEffect } from "react";
// import { socket } from "../../client/socket";
// import CanvasDraw from "../../components/CanvasDraw";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");

  const join_room = () => {
    if (!name || name == undefined) {
      alert("fill the name");
      return;
    }

    socket.emit("join_room_req", { name });

    router.push("/play");
  };

  return (
    <div className="text-blue-700">
      <label htmlFor="name">name</label>
      <input
        required
        type="text"
        className="bg-amber-400"
        id="name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
        }}
      />
      <button onClick={join_room}>join</button>
    </div>
  );
}
