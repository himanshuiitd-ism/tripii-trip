// hooks/useRoomData.js
import { useSelector } from "react-redux";

export default function useRoomData(roomId) {
  const rooms = useSelector((s) => s.community.rooms || []);
  return rooms.find((r) => r._id === roomId);
}
