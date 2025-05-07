import { io } from "socket.io-client";

const socket = io("http://localhost:3618", {
  autoConnect: true,
});

export default socket;
