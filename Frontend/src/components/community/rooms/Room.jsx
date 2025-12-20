// Room.jsx
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import useRoomData from "./hooks/useRoomData";
import useRoomSocket from "./hooks/useRoomSocket";
import useRoomMessages from "./hooks/useRoomMessages";
import useSendRoomMessage from "./hooks/useSendRoomMessage";

import RoomChat from "./components/RoomChat";
import RoomInput from "./components/RoomInput";
import RoomMembers from "./components/RoomMembers";
import TripInfoCard from "./components/TripInfoCard";
import RoomHeader from "./components/RoomHeader";
import { useEffect } from "react";
import { clearRoomState, setSelectedRoom } from "@/redux/roomSlice";
import React from "react";

const Room = () => {
  const { roomId } = useParams();
  const dispatch = useDispatch();
  const room = useRoomData(roomId);

  useEffect(() => {
    // 🔥 CLEAR OLD ROOM DATA
    dispatch(clearRoomState());

    // set new room
    dispatch(setSelectedRoom(roomId));

    return () => {
      // 🔥 ALSO clear when leaving room
      dispatch(clearRoomState());
    };
  }, [roomId, dispatch]);

  const { roomMessages } = useSelector((s) => s.room);

  useRoomSocket(roomId, dispatch);
  useRoomMessages(roomId);

  const { send } = useSendRoomMessage(roomId);

  if (!room) return null;

  return (
    <div className="Room">
      {/* FIXED HEADER */}
      <RoomHeader room={room} />

      {/* BODY */}
      <div className="Room-body">
        {/* CHAT */}
        <div className="Room-chat">
          <RoomChat />
        </div>

        {/* INPUT */}
        <RoomInput onSend={send} />
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="Room-sidebar">
        <TripInfoCard room={room} />
        <RoomMembers members={room.members} />
      </div>
    </div>
  );
};

export default Room;
