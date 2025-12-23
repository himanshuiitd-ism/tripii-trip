import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getRoomDetails } from "@/api/room";
import {
  setSelectedRoomData,
  setRoomLoading,
  setRoomError,
} from "@/redux/roomSlice";

export default function useRoomData(roomId) {
  const dispatch = useDispatch();

  const { selectedRoomData, loading } = useSelector((s) => s.room);

  useEffect(() => {
    if (!roomId) return;

    // already loaded & correct room
    if (selectedRoomData?._id === roomId) return;

    let ignore = false;

    const fetchRoom = async () => {
      try {
        dispatch(setRoomLoading(true));
        const res = await getRoomDetails(roomId);
        console.log("Himanshu");
        if (!ignore) {
          dispatch(setSelectedRoomData(res.data.data));
        }
      } catch (err) {
        if (!ignore) {
          dispatch(setRoomError("Failed to load room"));
        }
      } finally {
        dispatch(setRoomLoading(false));
      }
    };

    fetchRoom();

    return () => {
      ignore = true;
    };
  }, [roomId]);

  return selectedRoomData;
}
