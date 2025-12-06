import { EVENTS } from "./events.js";

export default function communitySocket(io, socket, communityRooms, typingMap) {
  const userId = socket.handshake.query.userId;

  // JOIN
  socket.on(EVENTS.COMMUNITY_JOIN, (communityId) => {
    socket.join(communityId);

    if (!communityRooms[communityId]) communityRooms[communityId] = new Set();
    communityRooms[communityId].add(userId);

    io.to(communityId).emit(EVENTS.COMMUNITY_COUNT, {
      communityId,
      online: communityRooms[communityId].size,
    });
  });

  // LEAVE
  socket.on(EVENTS.COMMUNITY_LEAVE, (communityId) => {
    socket.leave(communityId);
    if (communityRooms[communityId]) {
      communityRooms[communityId].delete(userId);

      io.to(communityId).emit(EVENTS.COMMUNITY_COUNT, {
        communityId,
        online: communityRooms[communityId].size,
      });
    }
  });

  // TYPING
  socket.on(EVENTS.COMMUNITY_TYPING, ({ communityId, isTyping }) => {
    socket.to(communityId).emit(EVENTS.COMMUNITY_TYPING, {
      userId,
      isTyping,
    });
  });

  // Auto cleanup on disconnect
  socket.on(EVENTS.DISCONNECT, () => {
    Object.keys(communityRooms).forEach((id) => {
      communityRooms[id]?.delete(userId);
    });
  });
}
