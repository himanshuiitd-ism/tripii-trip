import { ArrowLeft, Settings, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function RoomHeader({ room }) {
  const navigate = useNavigate();

  return (
    <header className="RoomHeader flex items-center justify-between bg-white/80 backdrop-blur-md px-4 py-3">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/community/${room.parentCommunity}`)}>
          <ArrowLeft size={18} />
        </button>

        <h2 className="font-bold">{room.name}</h2>
      </div>

      <div className="flex gap-2">
        <Bell size={16} />
        <Settings size={16} />
      </div>
    </header>
  );
}
