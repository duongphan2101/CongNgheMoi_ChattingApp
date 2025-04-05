const express = require("express");
const cors = require("cors");
const AWS = require("aws-sdk");
const http = require("http");
const socketIo = require("socket.io");

require("dotenv").config({ path: "../.env" });

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*" }
});

const PORT = 3618;

AWS.config.update({
    region: process.env.AWS_REGION || "ap-southeast-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

app.use(express.json());
app.use(cors());

const conversationRoutes = require("./routers/conversationRouter");
const chatRoomRoutes = require("./routers/ChatRoomRouter");
const messageRoutes = require("./routers/messageRouter")(io);

app.use("/", conversationRoutes);
app.use("/", chatRoomRoutes);
app.use("/", messageRoutes);

// Xử lý socket.io
io.on("connection", (socket) => {

    socket.on("joinRoom", (chatRoomId) => {
        socket.join(chatRoomId);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

// Chạy server với WebSocket
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

