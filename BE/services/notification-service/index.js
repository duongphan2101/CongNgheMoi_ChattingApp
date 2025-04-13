const express = require("express");
const http = require("http");
const { createClient } = require("redis");
const socketIo = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const PORT = 3515;

// Thiết lập Socket.IO server
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

// Redis Subscriber
const redisSubscriber = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
  },
});

// Khi client kết nối socket
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Client sẽ join phòng theo userId
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined room ${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Kết nối Redis và lắng nghe kênh "notifications"
redisSubscriber.connect()
  .then(() => {
    console.log("Redis subscriber connected");

    redisSubscriber.subscribe("notifications", (message) => {
      try {
        const data = JSON.parse(message);
        console.log("Nhận notification:", data);

        // Gửi notification đến user nhận (receiver)
        const { to } = data;
        io.to(to).emit("notification", data);

      } catch (err) {
        console.error("Lỗi xử lý Redis message:", err);
      }
    });
  })
  .catch((err) => {
    console.error("Redis subscriber failed to connect:", err);
  });

// HTTP kiểm tra
app.get("/", (req, res) => {
  res.send("Notification Service is running.");
});

// Khởi động server
server.listen(PORT, () => {
  console.log(`🚀 Notification-service is running at http://localhost:${PORT}`);
});

