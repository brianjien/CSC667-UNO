//backend/sockets/initialize.js
import { Server } from "socket.io";

const bindToSession = (socket) => {
  const { request } = socket;

  socket.join(request.session.id);

  socket.use((_, next) => {
    request.session.reload((error) => {
      if (error) {
        socket.disconnect();
      } else {
        next();
      }
    });
  });
};

export default function initialize(server) {
  const io = new Server(server);

  io.on("connection", (socket) => {
    bindToSession(socket);
    socket.on("disconnect", () => {
      console.log(`user disconnected with session id ${socket.request.session.id}`);
    });
  });

  return io;
}