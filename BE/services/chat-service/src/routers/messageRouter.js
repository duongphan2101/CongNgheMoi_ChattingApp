const express = require("express");
const AWS = require("aws-sdk");
const Message = require("../models/message");
const multer = require("multer");
const multerS3 = require("multer-s3");
const router = express.Router();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const TABLE_MESSAGE_NAME = "Message";
const TABLE_CONVERSATION_NAME = "Conversations";
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "lab2s3aduong";
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

module.exports = (io, redisPublisher) => {
  const isUserOnline = (userId) => {
    // Thay thế bằng logic kiểm tra trạng thái đăng nhập thực tế
    return io.sockets.adapter.rooms.has(userId);
  };

  router.post("/sendMessage", async (req, res) => {
    try {
      const { chatRoomId, sender, receiver, message } = req.body;

      if (!chatRoomId || !sender || !receiver || !message) {
        console.error("❌ Thiếu dữ liệu từ client:", req.body);
        return res.status(400).json({ error: "Thiếu trường bắt buộc!" });
      }

      const chatId = [sender, receiver].sort().join("_");

      // Tạo tin nhắn mới
      const newMessage = new Message(
        chatRoomId,
        sender,
        receiver,
        message,
        "text"
      );

      // Lưu tin nhắn vào bảng Message
      const params = {
        TableName: TABLE_MESSAGE_NAME,
        Item: newMessage,
      };

      await dynamoDB.put(params).promise();
      console.log("✅ Tin nhắn đã lưu vào DB:", newMessage);

      // Lấy thông tin participants từ bảng Conversations
      const getConversationParams = {
        TableName: TABLE_CONVERSATION_NAME,
        Key: { chatId },
      };

      console.log(chatId)

      const conversationData = await dynamoDB.get(getConversationParams).promise();

      if (!conversationData.Item || !conversationData.Item.participants) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy cuộc trò chuyện!" });
      }

      const participants = conversationData.Item.participants;
      const unreadFor = participants.filter((p) => p !== sender); // Loại sender ra khỏi danh sách unread

      // Lấy danh sách hiện tại từ conversation
      const currentUnreadList = conversationData.Item.isUnreadBy || [];

      // Thêm các phần tử mới vào danh sách, đảm bảo không trùng lặp
      const updatedUnreadList = Array.from(new Set([...currentUnreadList, ...unreadFor]));

      // Cập nhật bảng Conversation
      const updateParams = {
        TableName: TABLE_CONVERSATION_NAME,
        Key: { chatId },
        UpdateExpression: "SET lastMessage = :lastMessage, lastMessageAt = :lastMessageAt, isUnreadBy = :updatedUnreadList",
        ExpressionAttributeValues: {
          ":lastMessage": message,
          ":lastMessageAt": new Date(newMessage.timestamp).toLocaleDateString(
            "vi-VN",
            {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }
          ),
          ":updatedUnreadList": updatedUnreadList,
        },
        ReturnValues: "UPDATED_NEW",
      };

      await dynamoDB.update(updateParams).promise();

      // Gửi tin nhắn đến các client trong phòng
      io.to(chatRoomId).emit("receiveMessage", newMessage);

      // Publish notify to Redis (đẩy qua channel 'notifications')
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

      // Xử lý lỗi rõ ràng hơn
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
        return res
          .status(400)
          .json({ error: "Thiếu chatRoomId hoặc messageId!" });
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

      // Nếu là tin nhắn loại file, xóa file khỏi S3
      if (message && message.type === "file") {
        try {
          const fileInfo = JSON.parse(message.message);
          const fileUrl = fileInfo.url;
          const urlParts = fileUrl.split("/");
          let key = urlParts.slice(3).join("/");

          if (key.indexOf("amazonaws.com/") > -1) {
            key = key.split("amazonaws.com/")[1];
          }

          console.log("Đang xóa file với key:", key);

          // Xóa file từ S3
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

      // Xóa tin nhắn từ DynamoDB
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
        return res
          .status(400)
          .json({ error: "Thiếu chatId hoặc phoneNumber!" });
      }

      // Trước tiên, kiểm tra conversation có tồn tại không
      const getParams = {
        TableName: TABLE_CONVERSATION_NAME,
        Key: { chatId },
      };

      const conversationData = await dynamoDB.get(getParams).promise();

      if (!conversationData.Item) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy cuộc trò chuyện!" });
      }

      const currentUnreadList = conversationData.Item.isUnreadBy || [];

      // Nếu không tồn tại hoặc không chứa số cần xóa thì bỏ qua
      if (!currentUnreadList.includes(phoneNumber)) {
        console.log(
          `ℹ️ Số ${phoneNumber} không có trong isUnreadBy => không cần xóa.`
        );
        return res
          .status(200)
          .json({ message: "Đã đọc hoặc không có gì để cập nhật!" });
      }

      // Loại bỏ phoneNumber khỏi danh sách
      const updatedUnreadList = currentUnreadList.filter(
        (user) => user !== phoneNumber
      );

      // Cập nhật lại danh sách isUnreadBy
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
      console.log(
        `✅ Đã xóa ${phoneNumber} khỏi isUnreadBy cho chatId:`,
        chatId
      );

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

      const audioUrl = req.file.location;

      // Tạo tin nhắn ghi âm mới
      const audioMessage = new Message(
        chatRoomId,
        sender,
        receiver,
        audioUrl,
        "audio"
      );

      // Lưu tin nhắn vào bảng Message
      await dynamoDB
        .put({
          TableName: TABLE_MESSAGE_NAME,
          Item: audioMessage,
        })
        .promise();

      console.log("✅ Tin nhắn ghi âm đã lưu vào DB:", audioMessage);

      const chatId = [sender, receiver].sort().join("_");

      // Lấy thông tin participants từ bảng Conversations
      const getConversationParams = {
        TableName: TABLE_CONVERSATION_NAME,
        Key: { chatId },
      };

      const conversationData = await dynamoDB.get(getConversationParams).promise();

      if (!conversationData.Item || !conversationData.Item.participants) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy cuộc trò chuyện!" });
      }

      const participants = conversationData.Item.participants;
      const unreadFor = participants.filter((p) => p !== sender); // Loại sender ra khỏi danh sách unread

      // Lấy danh sách hiện tại từ conversation
      const currentUnreadList = conversationData.Item.isUnreadBy || [];

      // Thêm các phần tử mới vào danh sách, đảm bảo không trùng lặp
      const updatedUnreadList = Array.from(new Set([...currentUnreadList, ...unreadFor]));

      // Cập nhật bảng Conversation
      const updateParams = {
        TableName: TABLE_CONVERSATION_NAME,
        Key: { chatId },
        UpdateExpression: "SET lastMessage = :lastMessage, lastMessageAt = :lastMessageAt, isUnreadBy = :updatedUnreadList",
        ExpressionAttributeValues: {
          ":lastMessage": "Tin Nhắn Thoại",
          ":lastMessageAt": new Date(audioMessage.timestamp).toLocaleDateString(
            "vi-VN",
            {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }
          ),
          ":updatedUnreadList": updatedUnreadList,
        },
        ReturnValues: "UPDATED_NEW",
      };

      await dynamoDB.update(updateParams).promise();

      console.log("✅ Đã cập nhật thông tin cuộc trò chuyện:", chatId);

      // Gửi tin nhắn đến các client trong phòng
      io.to(chatRoomId).emit("receiveMessage", audioMessage);

      // Publish notify to Redis (đẩy qua channel 'notifications')
      const notifyPayload = JSON.stringify({
        type: "audio",
        to: receiver,
        from: sender,
        audioMessage,
        timestamp: audioMessage.timestamp,
      });

      redisPublisher.publish("notifications", notifyPayload);
      console.log("Đã publish thông báo:", notifyPayload);

      res.status(201).json({ success: true, data: audioMessage });
    } catch (err) {
      console.error("❌ Lỗi khi gửi ghi âm:", err);
      res.status(500).json({ error: "Lỗi server!" });
    }
  });

  return router;
};
