import { EVENTS } from "./events.js";

export default function tripSocket(io, socket) {
  const userId =
    socket.handshake.auth?.userId || socket.handshake.query?.userId;

  // ---------------- JOIN TRIP ----------------
  socket.on(EVENTS.TRIP_JOIN, (tripId) => {
    if (!tripId) return;

    const room = `trip:${String(tripId)}`;
    socket.join(room);

    console.log(`🧭 User ${userId} joined ${room}`);
  });

  // ---------------- LEAVE TRIP ----------------
  socket.on(EVENTS.TRIP_LEAVE, (tripId) => {
    if (!tripId) return;

    const room = `trip:${String(tripId)}`;
    socket.leave(room);

    console.log(`🚪 User ${userId} left ${room}`);
  });
}
