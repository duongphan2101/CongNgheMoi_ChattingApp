const express = require("express");
const AWS = require("aws-sdk");
const Message = require("../models/message");
const multer = require("multer");
const fs = require("fs").promises;
const path = require("path");
const router = express.Router();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const TABLE_MESSAGE_NAME = "Message";
const TABLE_CONVERSATION_NAME = "Conversations";
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "lab2s3aduong";

const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

// Cấu hình multer để lưu tệp tạm trên disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const filename = `audio-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, filename);
  },
});
const upload = multer({ storage });

// Tạo thư mục uploads nếu chưa có
const uploadDir = path.join(__dirname, "..", "uploads");
fs.mkdir(uploadDir, { recursive: true });

module.exports = (io, redisPublisher) => {
  const isUserOnline = (userId) => {
    return io.sockets.adapter.rooms.has(userId);
  };

  router.post("/sendMessage", async (req, res) => {
    try {
      const { chatRoomId, sender, receiver, message, replyTo } = req.body;

      if (!chatRoomId || !sender || !receiver || !message) {
        console.error("❌ Thiếu dữ liệu từ client:", req.body);
        return res.status(400).json({ error: "Thiếu trường bắt buộc!" });
      }

      const chatId = [sender, receiver].sort().join("_");
      const newMessage = new Message(chatRoomId, sender, receiver, message, "text");
      
      if (replyTo) {
        // Kiểm tra nếu tin nhắn được reply là tin nhắn thoại
        const repliedMessageParams = {
          TableName: TABLE_MESSAGE_NAME,
          Key: {
            chatRoomId: chatRoomId,
            timestamp: replyTo.timestamp,
          },
        };
        const repliedMessageData = await dynamoDB.get(repliedMessageParams).promise();
        const repliedMessage = repliedMessageData.Item;
  
        newMessage.replyTo = {
          timestamp: replyTo.timestamp,
          message: repliedMessage && repliedMessage.type === "audio" ? "Tin nhắn thoại" : replyTo.message,
          sender: replyTo.sender,
        };
      }
    

      const params = {
        TableName: TABLE_MESSAGE_NAME,
        Item: newMessage,
      };

      await dynamoDB.put(params).promise();
      console.log("✅ Tin nhắn đã lưu vào DB:", newMessage);

      const getConversationParams = {
        TableName: TABLE_CONVERSATION_NAME,
        Key: { chatId },
      };

      const conversationData = await dynamoDB.get(getConversationParams).promise();

      if (!conversationData.Item || !conversationData.Item.participants) {
        return res.status(404).json({ error: "Không tìm thấy cuộc trò chuyện!" });
      }

      const participants = conversationData.Item.participants;
      const unreadFor = participants.filter((p) => p !== sender);
      const currentUnreadList = conversationData.Item.isUnreadBy || [];
      const updatedUnreadList = Array.from(new Set([...currentUnreadList, ...unreadFor]));

      const updateParams = {
        TableName: TABLE_CONVERSATION_NAME,
        Key: { chatId },
        UpdateExpression: "SET lastMessage = :lastMessage, lastMessageAt = :lastMessageAt, isUnreadBy = :updatedUnreadList",
        ExpressionAttributeValues: {
          ":lastMessage": message,
          ":lastMessageAt": new Date(newMessage.timestamp).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          ":updatedUnreadList": updatedUnreadList,
        },
        ReturnValues: "UPDATED_NEW",
      };

      await dynamoDB.update(updateParams).promise();

      io.to(chatRoomId).emit("receiveMessage", newMessage);

      const notifyPayload = JSON.stringify({
        type: "new_message",
        to: receiver,
        from: sender,
        message,
        timestamp: newMessage.timestamp,
      });

      redisPublisher.publish("notifications", notifyPayload);
      console.log("Đã publish thông báo:", notifyPayload);

      res.status(200).json({ message: "Gửi tin nhắn thành công!" });
    } catch (error) {
      console.error("❌ Lỗi khi lưu tin nhắn:", error);
      if (error.name === "ValidationException") {
        return res.status(400).json({
          error: "Lỗi dữ liệu khi cập nhật. Đảm bảo isUnreadBy là kiểu Set.",
        });
      }
      res.status(500).json({ error: "Lỗi server!" });
    }
  });

  router.delete("/deleteMessage", async (req, res) => {
    try {
      const { chatRoomId, messageId } = req.body;

      if (!chatRoomId || !messageId) {
        return res.status(400).json({ error: "Thiếu chatRoomId hoặc messageId!" });
      }

      const getParams = {
        TableName: TABLE_MESSAGE_NAME,
        Key: {
          chatRoomId: chatRoomId,
          timestamp: messageId,
        },
      };

      const messageResult = await dynamoDB.get(getParams).promise();
      const message = messageResult.Item;

      if (message && (message.type === "file" || message.type === "audio")) {
        try {
          const fileUrl = message.message;
          const urlParts = fileUrl.split("/");
          let key = urlParts.slice(3).join("/");

          if (key.indexOf("amazonaws.com/") > -1) {
            key = key.split("amazonaws.com/")[1];
          }

          console.log("Đang xóa file với key:", key);

          const deleteParams = {
            Bucket: BUCKET_NAME,
            Key: key,
          };

          await s3.deleteObject(deleteParams).promise();
          console.log("✅ Đã xóa file từ S3 thành công");
        } catch (fileError) {
          console.error("❌ Lỗi khi xóa file từ S3:", fileError);
        }
      }

      const deleteParams = {
        TableName: TABLE_MESSAGE_NAME,
        Key: {
          chatRoomId: chatRoomId,
          timestamp: messageId,
        },
      };

      await dynamoDB.delete(deleteParams).promise();
      console.log("Đã xóa tin nhắn:", messageId);

      io.to(chatRoomId).emit("messageDeleted", { messageId });

      res.status(200).json({ message: "Xóa tin nhắn thành công!" });
    } catch (error) {
      console.error("Lỗi khi xóa tin nhắn:", error);
      res.status(500).json({ error: "Lỗi server!" });
    }
  });

  router.post("/markAsRead", async (req, res) => {
    try {
      const { chatId, phoneNumber } = req.body;

      if (!chatId || !phoneNumber) {
        return res.status(400).json({ error: "Thiếu chatId hoặc phoneNumber!" });
      }

      const getParams = {
        TableName: TABLE_CONVERSATION_NAME,
        Key: { chatId },
      };

      const conversationData = await dynamoDB.get(getParams).promise();

      if (!conversationData.Item) {
        return res.status(404).json({ error: "Không tìm thấy cuộc trò chuyện!" });
      }

      const currentUnreadList = conversationData.Item.isUnreadBy || [];

      if (!currentUnreadList.includes(phoneNumber)) {
        console.log(`ℹ️ Số ${phoneNumber} không có trong isUnreadBy => không cần xóa.`);
        return res.status(200).json({ message: "Đã đọc hoặc không có gì để cập nhật!" });
      }

      const updatedUnreadList = currentUnreadList.filter((user) => user !== phoneNumber);

      const updateParams = {
        TableName: TABLE_CONVERSATION_NAME,
        Key: { chatId },
        UpdateExpression: "SET isUnreadBy = :updatedUnreadList",
        ExpressionAttributeValues: {
          ":updatedUnreadList": updatedUnreadList,
        },
        ReturnValues: "UPDATED_NEW",
      };

      const result = await dynamoDB.update(updateParams).promise();
      console.log(`✅ Đã xóa ${phoneNumber} khỏi isUnreadBy cho chatId:`, chatId);

      res.status(200).json({
        message: "Đã đánh dấu là đã đọc!",
        updatedAttributes: result.Attributes,
      });
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật isUnreadBy:", error);
      res.status(500).json({ error: "Lỗi server!" });
    }
  });

  router.post("/sendAudio", upload.single("file"), async (req, res) => {
    try {
      const { chatRoomId, sender, receiver } = req.body;
  
      if (!req.file || !chatRoomId || !sender || !receiver) {
        return res.status(400).json({ error: "Thiếu dữ liệu!" });
      }
  
      const inputPath = req.file.path;
      const outputPath = path.join(__dirname, "..", "uploads", `converted-${Date.now()}.mp3`);
  
      // Chuyển đổi tệp âm thanh sang .mp3
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .toFormat('mp3')
          .audioBitrate(128)
          .audioChannels(2)
          .audioFrequency(44100)
          .on('end', resolve)
          .on('error', (err) => reject(new Error(`Lỗi chuyển đổi MP3: ${err.message}`)))
          .save(outputPath);
      });
  
      // Tải lên S3
      const fileContent = await fs.readFile(outputPath);
      const fileName = `audio-${Date.now()}.mp3`;
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: fileContent,
        ContentType: "audio/mpeg", // Đúng cho .mp3
        ACL: "public-read",
      };
      const uploadResult = await s3.upload(uploadParams).promise();
  
      // Xóa tệp tạm
      await fs.unlink(inputPath);
      await fs.unlink(outputPath);
  
      const audioUrl = uploadResult.Location;
      const audioMessage = new Message(chatRoomId, sender, receiver, "Tin nhắn thoại", "audio");
      audioMessage.fileInfo = { url: audioUrl };
  
      await dynamoDB.put({
        TableName: TABLE_MESSAGE_NAME,
        Item: audioMessage,
      }).promise();
  
      console.log("✅ Tin nhắn ghi âm đã lưu vào DB:", audioMessage);
  
      const chatId = [sender, receiver].sort().join("_");
      const getConversationParams = {
        TableName: TABLE_CONVERSATION_NAME,
        Key: { chatId },
      };
  
      const conversationData = await dynamoDB.get(getConversationParams).promise();
  
      if (!conversationData.Item || !conversationData.Item.participants) {
        return res.status(404).json({ error: "Không tìm thấy cuộc trò chuyện!" });
      }
  
      const participants = conversationData.Item.participants;
      const unreadFor = participants.filter((p) => p !== sender);
      const currentUnreadList = conversationData.Item.isUnreadBy || [];
      const updatedUnreadList = Array.from(new Set([...currentUnreadList, ...unreadFor]));
  
      const updateParams = {
        TableName: TABLE_CONVERSATION_NAME,
        Key: { chatId },
        UpdateExpression: "SET lastMessage = :lastMessage, lastMessageAt = :lastMessageAt, isUnreadBy = :updatedUnreadList",
        ExpressionAttributeValues: {
          ":lastMessage": "Tin Nhắn Thoại",
          ":lastMessageAt": new Date(audioMessage.timestamp).toISOString(),
          ":updatedUnreadList": updatedUnreadList,
        },
        ReturnValues: "UPDATED_NEW",
      };
  
      await dynamoDB.update(updateParams).promise();
  
      console.log("✅ Đã cập nhật thông tin cuộc trò chuyện:", chatId);
  
      io.to(chatRoomId).emit("receiveMessage", audioMessage);
  
      const notifyPayload = JSON.stringify({
        type: "audio",
        to: receiver,
        from: sender,
        message: "Tin nhắn thoại",
        timestamp: audioMessage.timestamp,
      });
  
      redisPublisher.publish("notifications", notifyPayload);
      console.log("Đã publish thông báo:", notifyPayload);
  
      res.status(201).json({ success: true, data: audioMessage });
    } catch (err) {
      console.error("❌ Lỗi khi gửi ghi âm:", err);
      res.status(500).json({ error: `Lỗi server: ${err.message}` });
    }
  });

  return router;
};