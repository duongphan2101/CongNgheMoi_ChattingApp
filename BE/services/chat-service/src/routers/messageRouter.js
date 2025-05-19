const express = require("express");
const AWS = require("aws-sdk");
const Message = require("../models/message");
const multer = require("multer");
const multerS3 = require("multer-s3");
const fs = require("fs").promises;
const path = require("path");
const router = express.Router();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const TABLE_MESSAGE_NAME = "Message";
const TABLE_CONVERSATION_NAME = "Conversations";
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "lab2s3aduong";
const { createSystemMessage } = require("../utils/utils");

const ffmpegPath = require("ffmpeg-static");
const ffmpeg = require("fluent-ffmpeg");
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
      const { chatRoomId, sender, receiver, message, chatId, replyTo } = req.body;
      if (!chatRoomId || !sender || !receiver || !message) {
        console.error("❌ Thiếu dữ liệu từ client:", req.body);
        return res.status(400).json({ error: "Thiếu trường bắt buộc!" });
      }

      const isDeletedBy = [];

      const newMessage = new Message(
        chatRoomId,
        sender,
        receiver,
        message,
        "text",
        isDeletedBy,
      );

      if (replyTo) {
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
          message:
            repliedMessage && repliedMessage.type === "audio"
              ? "Tin nhắn thoại"
              : repliedMessage && repliedMessage.type === "file"
                ? "file"
                : replyTo.message,
          sender: replyTo.sender,
        };
      }
      const params = {
        TableName: TABLE_MESSAGE_NAME,
        Item: newMessage,
      };

      await dynamoDB.put(params).promise();
      console.log("Tin nhắn đã lưu vào DB:", newMessage);

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

      // Lấy tin nhắn cần thu hồi
      const getParams = {
        TableName: TABLE_MESSAGE_NAME,
        Key: {
          chatRoomId: chatRoomId,
          timestamp: messageId,
        },
      };

      const messageResult = await dynamoDB.get(getParams).promise();
      const message = messageResult.Item;

      if (!message) {
        return res.status(404).json({ error: "Không tìm thấy tin nhắn!" });
      }

      // Xử lý xóa file nếu là tin nhắn file/audio
      if (message && (message.type === "file" || message.type === "audio")) {
        try {
          const fileUrl = message.message;
          const urlParts = fileUrl.split("/");
          let key = urlParts.slice(3).join("/");

          if (key.indexOf("amazonaws.com/") > -1) {
            key = key.split("amazonaws.com/")[1];
          }

          const deleteParams = {
            Bucket: BUCKET_NAME,
            Key: key,
          };

          await s3.deleteObject(deleteParams).promise();
        } catch (fileError) {
          console.error("❌ Lỗi khi xóa file từ S3:", fileError);
        }
      }

      // Cập nhật tin nhắn thành đã thu hồi
      const updateParams = {
        TableName: TABLE_MESSAGE_NAME,
        Key: {
          chatRoomId: chatRoomId,
          timestamp: messageId,
        },
        UpdateExpression:
          "SET #msg = :newMsg, #isRevoked = :isRevoked, #originalType = :originalType, #reactions = :emptyReactions",
        ExpressionAttributeNames: {
          "#msg": "message",
          "#isRevoked": "isRevoked",
          "#originalType": "originalType",
          "#reactions": "reactions",
        },
        ExpressionAttributeValues: {
          ":newMsg": "Tin nhắn đã được thu hồi",
          ":isRevoked": true,
          ":originalType": message.type,
          ":emptyReactions": {},
        },
        ReturnValues: "ALL_NEW",
      };

      if (message.type === "text" || message.type === "file" || message.type === "audio") {
        updateParams.UpdateExpression += ", #type = :type";
        updateParams.ExpressionAttributeNames["#type"] = "type";
        updateParams.ExpressionAttributeValues[":type"] = "revoked";
      }

      const updatedMessage = await dynamoDB.update(updateParams).promise();

      // Lấy tất cả tin nhắn và sắp xếp theo thời gian
      const messagesParams = {
        TableName: TABLE_MESSAGE_NAME,
        FilterExpression: "chatRoomId = :chatRoomId",
        ExpressionAttributeValues: { ":chatRoomId": chatRoomId },
      };

      const messagesResult = await dynamoDB.scan(messagesParams).promise();
      const messages = messagesResult.Items;
      messages.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));

      // Tìm chatId từ bảng Conversations dựa trên chatRoomId
      const conversationParams = {
        TableName: TABLE_CONVERSATION_NAME,
        FilterExpression: "chatRoomId = :chatRoomId",
        ExpressionAttributeValues: { ":chatRoomId": chatRoomId },
      };

      const conversationResult = await dynamoDB.scan(conversationParams).promise();
      if (!conversationResult.Items || conversationResult.Items.length === 0) {
        return res.status(404).json({ error: "Không tìm thấy cuộc trò chuyện!" });
      }

      const chatId = conversationResult.Items[0].chatId;

      // Tìm tin nhắn mới nhất không bị thu hồi
      const latestValidMessage = messages.find((msg) => !msg.isRevoked);

      // Chuẩn bị nội dung lastMessage
      let lastMessageContent = "Tin nhắn đã được thu hồi";
      let lastMessageAt = new Date().toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const lastMessage = messages[0];
      if (lastMessage && lastMessage.timestamp === messageId) {
        // Nếu là tin nhắn cuối cùng, giữ nguyên "Tin nhắn đã được thu hồi"
        lastMessageContent = "Tin nhắn đã được thu hồi";
      } else {
        // Nếu không phải tin nhắn cuối cùng, giữ nguyên tin nhắn cuối
        lastMessageContent =
          lastMessage.type === "audio"
            ? "Tin nhắn thoại"
            : lastMessage.type === "file"
              ? "File đính kèm"
              : lastMessage.message;
        lastMessageAt = new Date(parseInt(lastMessage.timestamp)).toLocaleDateString(
          "vi-VN",
          {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          },
        );
      }

      // Cập nhật Conversation
      const updateConversationParams = {
        TableName: TABLE_CONVERSATION_NAME,
        Key: { chatId },
        UpdateExpression: "SET lastMessage = :lastMessage, lastMessageAt = :lastMessageAt",
        ExpressionAttributeValues: {
          ":lastMessage": lastMessageContent,
          ":lastMessageAt": lastMessageAt,
        },
      };

      await dynamoDB.update(updateConversationParams).promise();

      // Gửi thông tin cập nhật qua socket
      io.to(chatRoomId).emit("messageRevoked", {
        ...updatedMessage.Attributes,
        lastMessage: lastMessageContent,
        lastMessageAt: lastMessageAt,
        chatId,
        chatRoomId,
      });

      res.status(200).json({
        message: "Thu hồi tin nhắn thành công!",
        lastMessage: lastMessageContent,
        lastMessageAt: lastMessageAt,
      });
    } catch (error) {
      console.error("Lỗi khi thu hồi tin nhắn:", error);
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

      if (!currentUnreadList.includes(phoneNumber)) {
        console.log(
          `Số ${phoneNumber} không có trong isUnreadBy => không cần xóa.`
        );
        return res
          .status(200)
          .json({ message: "Đã đọc hoặc không có gì để cập nhật!" });
      }

      const updatedUnreadList = currentUnreadList.filter(
        (user) => user !== phoneNumber
      );

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

  // Backend: API markAsReadGroup
  router.post("/markAsReadGroup", async (req, res) => {
    try {
      const { chatRoomId, phoneNumber } = req.body;
  
      if (!chatRoomId || !phoneNumber) {
        return res
          .status(400)
          .json({ error: "Thiếu chatRoomId hoặc phoneNumber!" });
      }
  
      const getParams = {
        TableName: TABLE_CONVERSATION_NAME,
        Key: { chatId: chatRoomId },
      };
  
      const conversationData = await dynamoDB.get(getParams).promise();
  
      if (!conversationData.Item) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy cuộc trò chuyện nhóm!" });
      }
  
      const currentUnreadList = conversationData.Item.isUnreadBy || [];
  
      if (!currentUnreadList.includes(phoneNumber)) {
        console.log(
          `Số ${phoneNumber} không có trong isUnreadBy => không cần xóa.`
        );
        return res
          .status(200)
          .json({ message: "Đã đọc hoặc không có gì để cập nhật!" });
      }
  
      const updatedUnreadList = currentUnreadList.filter(
        (user) => user !== phoneNumber
      );
  
      const updateParams = {
        TableName: TABLE_CONVERSATION_NAME,
        Key: { chatId: chatRoomId },
        UpdateExpression: "SET isUnreadBy = :updatedUnreadList",
        ExpressionAttributeValues: {
          ":updatedUnreadList": updatedUnreadList,
        },
        ReturnValues: "UPDATED_NEW",
      };
  
      const result = await dynamoDB.update(updateParams).promise();
      console.log(
        `✅ Đã xóa ${phoneNumber} khỏi isUnreadBy cho chatRoomId:`,
        chatRoomId
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
      const { chatRoomId, sender, receiver, chatId } = req.body;

      if (!req.file || !chatRoomId || !sender || !receiver) {
        return res.status(400).json({ error: "Thiếu dữ liệu!" });
      }

      const inputPath = req.file.path;
      const outputPath = path.join(
        __dirname,
        "..",
        "uploads",
        `converted-${Date.now()}.mp3`
      );

      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .toFormat("mp3")
          .audioBitrate(128)
          .audioChannels(2)
          .audioFrequency(44100)
          .on("end", resolve)
          .on("error", (err) =>
            reject(new Error(`Lỗi chuyển đổi MP3: ${err.message}`))
          )
          .save(outputPath);
      });

      const fileContent = await fs.readFile(outputPath);
      const fileName = `audio-${Date.now()}.mp3`;
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: fileContent,
        ContentType: "audio/mpeg",
        ACL: "public-read",
      };
      const uploadResult = await s3.upload(uploadParams).promise();

      await fs.unlink(inputPath);
      await fs.unlink(outputPath);

      const audioUrl = uploadResult.Location;
      const audioMessage = new Message(
        chatRoomId,
        sender,
        receiver,
        "Tin nhắn thoại",
        "audio"
      );
      audioMessage.fileInfo = { url: audioUrl };

      await dynamoDB
        .put({
          TableName: TABLE_MESSAGE_NAME,
          Item: audioMessage,
        })
        .promise();

      console.log("✅ Tin nhắn ghi âm đã lưu vào DB:", audioMessage);

      const getConversationParams = {
        TableName: TABLE_CONVERSATION_NAME,
        Key: { chatId },
      };

      const conversationData = await dynamoDB
        .get(getConversationParams)
        .promise();

      if (!conversationData.Item || !conversationData.Item.participants) {
        return res
          .status(404)
          .json({ error: "Không tìm thấy cuộc trò chuyện!" });
      }

      const participants = conversationData.Item.participants;
      const unreadFor = participants.filter((p) => p !== sender);
      const currentUnreadList = conversationData.Item.isUnreadBy || [];
      const updatedUnreadList = Array.from(
        new Set([...currentUnreadList, ...unreadFor])
      );

      const updateParams = {
        TableName: TABLE_CONVERSATION_NAME,
        Key: { chatId },
        UpdateExpression:
          "SET lastMessage = :lastMessage, lastMessageAt = :lastMessageAt, isUnreadBy = :updatedUnreadList",
        ExpressionAttributeValues: {
          ":lastMessage": "Tin Nhắn Thoại",
          ":lastMessageAt": new Date(audioMessage.timestamp).toLocaleString(
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

  router.post("/addReaction", async (req, res) => {
    try {
      const { chatRoomId, messageId, user, reaction } = req.body;
      if (!chatRoomId || !messageId || !user || !reaction) {
        return res.status(400).json({ error: "Thiếu dữ liệu!" });
      }

      const getParams = {
        TableName: TABLE_MESSAGE_NAME,
        Key: {
          chatRoomId: chatRoomId,
          timestamp: messageId,
        },
      };

      const messageData = await dynamoDB.get(getParams).promise();
      if (!messageData.Item) {
        return res.status(404).json({ error: "Không tìm thấy tin nhắn!" });
      }

      const message = messageData.Item;
      if (!message.reactions) {
        message.reactions = {};
      }

      if (!message.reactions[reaction]) {
        message.reactions[reaction] = [];
      }

      const userIndex = message.reactions[reaction].indexOf(user);
      if (userIndex !== -1) {
        message.reactions[reaction].splice(userIndex, 1);
        if (message.reactions[reaction].length === 0) {
          delete message.reactions[reaction];
        }
      } else {
        message.reactions[reaction].push(user);
      }

      const updateParams = {
        TableName: TABLE_MESSAGE_NAME,
        Key: {
          chatRoomId: chatRoomId,
          timestamp: messageId,
        },
        UpdateExpression: "SET reactions = :reactions",
        ExpressionAttributeValues: {
          ":reactions": message.reactions,
        },
        ReturnValues: "ALL_NEW",
      };

      const updatedMessage = await dynamoDB.update(updateParams).promise();

      io.to(chatRoomId).emit("messageReacted", {
        messageId: messageId,
        reactions: message.reactions,
      });

      res.status(200).json({ success: true, reactions: message.reactions });
    } catch (error) {
      console.error("Lỗi khi thêm reaction:", error);
      res.status(500).json({ error: "Lỗi server!" });
    }
  });

  router.post("/updateGroupAvatar", upload.single("avatar"), async (req, res) => {
    try {
      const { chatRoomId } = req.body;
      if (!req.file || !chatRoomId) {
        return res.status(400).json({ error: "Thiếu file hoặc chatRoomId!" });
      }

      const fileContent = await fs.readFile(req.file.path);
      const fileName = `group-avatar-${Date.now()}${path.extname(req.file.originalname)}`;
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: `group-avatars/${fileName}`,
        Body: fileContent,
        ContentType: req.file.mimetype,
        ACL: "public-read",
      };

      const uploadResult = await s3.upload(uploadParams).promise();
      const avatarUrl = uploadResult.Location;

      const conversationsResult = await dynamoDB.scan({
        TableName: TABLE_CONVERSATION_NAME,
        FilterExpression: "chatRoomId = :chatRoomId",
        ExpressionAttributeValues: { ":chatRoomId": chatRoomId },
      }).promise();

      if (!conversationsResult.Items || conversationsResult.Items.length === 0) {
        throw new Error("Không tìm thấy cuộc trò chuyện!");
      }

      const conversation = conversationsResult.Items[0];
      const chatId = conversation.chatId;

      await Promise.all([
        dynamoDB.update({
          TableName: TABLE_CONVERSATION_NAME,
          Key: { chatId },
          UpdateExpression: "SET avatar = :avatarUrl",
          ExpressionAttributeValues: { ":avatarUrl": avatarUrl },
        }).promise(),
        dynamoDB.update({
          TableName: "ChatRooms",
          Key: { chatRoomId: chatRoomId },
          UpdateExpression: "SET avatar = :avatarUrl",
          ExpressionAttributeValues: { ":avatarUrl": avatarUrl },
        }).promise(),
      ]);

      // Tạo tin nhắn hệ thống
      const systemMessage = await createSystemMessage(
        chatRoomId,
        conversation.participants,
        "Avatar nhóm đã được thay đổi",
        "CHANGE_AVATAR"
      );
      io.to(chatRoomId).emit("receiveMessage", systemMessage);

      await fs.unlink(req.file.path);

      io.emit("groupAvatarUpdated", {
        chatRoomId,
        chatId,
        newAvatarUrl: avatarUrl,
        updatedAt: new Date().toISOString(),
      });

      res.status(200).json({
        message: "Cập nhật avatar thành công!",
        avatarUrl,
        chatId,
        chatRoomId,
      });
    } catch (error) {
      if (req.file) await fs.unlink(req.file.path).catch(console.error);
      console.error("Lỗi khi cập nhật avatar:", error);
      res.status(500).json({ error: "Lỗi server!" });
    }
  });

  return router;
};