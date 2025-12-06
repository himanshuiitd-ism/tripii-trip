import { EVENTS } from "./events.js";

export default function chatSocket(io, socket) {
  socket.on("joinDM", (roomId) => {
    socket.join(roomId);
  });

  socket.on(EVENTS.MESSAGE_SEND, (payload) => {
    io.to(payload.roomId).emit(EVENTS.MESSAGE_RECEIVE, payload);
  });
}
