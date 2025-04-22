const socketIo = require("socket.io");
const http = require("http");
const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: "../.env" });

const app = express();
const server = http.createServer(app);
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

const io = socketIo(server, {
  cors: { origin: "*" },
});

const userRoutes = require("./routes/userRouters");
app.use("/user", userRoutes);

// WebSocket handlers
io.on("connection", (socket) => {
  console.log("Người dùng đã kết nối:", socket.id);

  // Lắng nghe sự kiện "register" để người dùng tham gia phòng dựa trên số điện thoại
  socket.on("register", (phoneNumber) => {
    socket.join(phoneNumber);
    console.log(`Người dùng với số điện thoại ${phoneNumber} đã tham gia phòng.`);
  });

  // Lắng nghe sự kiện "newFriendRequest" để gửi yêu cầu kết bạn đến người nhận
  socket.on("newFriendRequest", (friendRequest) => {
    const { receiverPhone, senderPhone } = friendRequest;
    console.log(`Nhận được yêu cầu kết bạn từ ${senderPhone} tới ${receiverPhone}`);

    // Gửi thông báo đến phòng của người nhận
    io.to(receiverPhone).emit("newFriendRequest", {
      senderPhone,
      message: "Bạn có một lời mời kết bạn mới!",
    });
  });

  // Xử lý khi người dùng ngắt kết nối
  socket.on("disconnect", () => {
    console.log("Người dùng đã ngắt kết nối:", socket.id);
  });
});

// Khởi động server
const PORT = process.env.PORT || 3824;
server.listen(PORT, () => {
  console.log(`User service đang chạy trên cổng ${PORT}`);
});