const express = require("express");
const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const Message = require("../models/message");

const router = express.Router();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "Message";

//Cấu hình AWS S3
const s3 = new AWS.S3();
const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    acl: "public-read",
    key: function (req, file, cb) {
      const filename = `audio-${Date.now()}.webm`;
      cb(null, filename);
    },
  }),
});

module.exports = (io) => {
  router.post("/sendMessage", async (req, res) => {
    try {
      const { chatRoomId, sender, receiver, message } = req.body;

      if (!chatRoomId || !sender || !receiver || !message) {
        console.error("Thiếu dữ liệu từ client:", req.body);
        return res.status(400).json({ error: "Thiếu trường bắt buộc!" });
      }

      const newMessage = new Message(chatRoomId, sender, receiver, message, "text");

      await dynamoDB.put({
        TableName: TABLE_NAME,
        Item: newMessage,
      }).promise();

      console.log("Tin nhắn văn bản đã lưu:", newMessage);
      io.to(chatRoomId).emit("receiveMessage", newMessage);
      res.status(201).json({ message: "Gửi thành công!", data: newMessage });
    } catch (error) {
      console.error("Lỗi khi lưu tin nhắn:", error);
      res.status(500).json({ error: "Lỗi server!" });
    }
  });

  // làm voice audio
router.post("/sendAudio", upload.single("file"), async (req, res) => {
  try {
      const { chatRoomId, sender, receiver } = req.body;

      if (!req.file || !chatRoomId || !sender || !receiver) {
          return res.status(400).json({ error: "Thiếu dữ liệu!" });
      }
      const audioUrl = req.file.location;
      const audioMessage = new Message(chatRoomId, sender, receiver, audioUrl, "audio");
      await dynamoDB.put({
          TableName: TABLE_NAME,
          Item: audioMessage,
      }).promise();

      console.log("Tin nhắn ghi âm đã lưu:", audioMessage);
      io.to(chatRoomId).emit("receiveMessage", audioMessage);
      res.status(201).json({ success: true, data: audioMessage });
  } catch (err) {
      console.error("Lỗi khi gửi ghi âm:", err);
      res.status(500).json({ error: "Lỗi server!" });
  }
});

  return router;
};