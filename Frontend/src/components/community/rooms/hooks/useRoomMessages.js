import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getRoomMessages } from "@/api/room";
import { setRoomMessages } from "@/redux/roomSlice";

export default function useRoomMessages(roomId) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!roomId) return;

    (async () => {
      const res = await getRoomMessages(roomId);
      dispatch(setRoomMessages(res.data.data.messages || []));
    })();
  }, [roomId]);
}
