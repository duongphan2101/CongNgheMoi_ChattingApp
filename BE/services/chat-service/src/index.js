const express = require("express");
const cors = require("cors");
const AWS = require("aws-sdk");
const http = require("http");
const socketIo = require("socket.io");
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");
require("dotenv").config({ path: "../.env" });

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*" },
});

const PORT = 3618;

const pubClient = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
    },
});

const subClient = pubClient.duplicate();

const redisPublisher = pubClient;
module.exports.redisPublisher = redisPublisher;

Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Socket.IO Redis adapter connected");
  })
  .catch((err) => {
    console.error("Redis connection failed:", err);
  });

// AWS SDK setup
AWS.config.update({
    region: process.env.AWS_REGION || "ap-southeast-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

app.use(express.json());
app.use(cors());

// Routers
const conversationRoutes = require("./routers/conversationRouter");
const chatRoomRoutes = require("./routers/ChatRoomRouter")(io, pubClient);
const messageRoutes = require("./routers/messageRouter")(io, pubClient);
const uploadFileRouter = require("./routers/uploadFileRouter")(io, pubClient);
const downloadRouter = require("./routers/downloadRouter");

app.use("/", conversationRoutes);
app.use("/", chatRoomRoutes);
app.use("/", messageRoutes);
app.use("/", uploadFileRouter);
app.use("/", downloadRouter);

// WebSocket handlers
io.on("connection", (socket) => {

    socket.on("joinRoom", (chatRoomId) => {
        socket.join(chatRoomId);
        console.log(`Socket ${socket.id} joined room ${chatRoomId}`);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });

    // Trong phần xử lý tạo conversation mới trên server
    socket.on('newConversation', (data) => {
    const { participants, chatRoomId } = data;
    console.log('Tạo conversation mới:', participants, 'với ID:', chatRoomId);

    // Emit sự kiện 'newConversation' đến tất cả các thành viên trong conversation
    participants.forEach(phone => {
      io.to(phone).emit('newConversation', {
        participants: participants,
        chatRoomId: chatRoomId
      });
    });
  });
});

// Start server
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Chat-service is running at http://localhost:${PORT}`);
});
