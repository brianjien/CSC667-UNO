// backend/sockets/index.js

import { Server } from "socket.io";
import { initialize } from "./initialize.js";

export const initSockets = (server) => {
  const io = new Server(server);
  initialize(io);
};
