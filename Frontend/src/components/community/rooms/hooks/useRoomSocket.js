import { useEffect } from "react";
import { socket } from "../../../../../Socket.js";
import { useDispatch } from "react-redux";
import {
  addRoomMessage,
  updateRoomMessage,
  removeRoomMessage,
} from "@/redux/roomSlice";

export default function useRoomSocket(roomId) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!roomId || !socket.connected) return;

    // ✅ JOIN ROOM
    socket.emit("room:join", roomId);

    // ✅ LISTEN
    socket.on("room:message:new", (msg) => {
      if (msg.room !== roomId) return;
      dispatch(addRoomMessage(msg));
    });

    socket.on("room:reaction:updated", ({ messageId, reactions }) => {
      dispatch(updateRoomMessage({ _id: messageId, reactions }));
    });

    socket.on("room:message:deleted", ({ messageId }) => {
      dispatch(removeRoomMessage(messageId));
    });

    // ✅ CLEANUP
    return () => {
      socket.emit("room:leave", roomId);

      socket.off("room:message:new");
      socket.off("room:reaction:updated");
      socket.off("room:message:deleted");
    };
  }, [roomId]);
}
