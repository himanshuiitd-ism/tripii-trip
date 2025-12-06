import { EVENTS } from "./events.js";

export default function userSocket(io, socket, userSocketMap, userLastSeen) {
  const userId = socket.handshake.query.userId;

  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
    userLastSeen[userId] = Date.now();

    io.emit(EVENTS.ONLINE_USERS, Object.keys(userSocketMap));
  }

  socket.on(EVENTS.DISCONNECT, () => {
    if (userId) {
      delete userSocketMap[userId];
      userLastSeen[userId] = Date.now();

      io.emit(EVENTS.ONLINE_USERS, Object.keys(userSocketMap));
    }
  });
}
