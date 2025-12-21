import { setSelectedRoomData } from "@/redux/roomSlice";
import { ArrowLeft, Settings, Bell } from "lucide-react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function RoomHeader({ room, setSetting }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  return (
    <header
      className="RoomHeader flex items-center justify-between bg-white/80 backdrop-blur-md px-4 py-3"
      style={{ width: "62vw", border: "1px solid rgba(0,0,0,0.2)" }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            navigate(`/community/${room.parentCommunity}`),
              dispatch(setSelectedRoomData(null));
          }}
        >
          <ArrowLeft size={18} />
        </button>

        <h2 className="font-bold"># {room.name}</h2>
      </div>

      <div
        className="flex gap-2"
        style={{
          justifyContent: "flex-end",
          width: "70px",
          height: "20px",
          // backgroundColor: "black",
        }}
      >
        {/* <Bell size={18} /> */}
        <Settings
          // size={16}
          onClick={() => {
            setSetting(true);
          }}
          className="room-header-icon"
        />
      </div>
    </header>
  );
}
