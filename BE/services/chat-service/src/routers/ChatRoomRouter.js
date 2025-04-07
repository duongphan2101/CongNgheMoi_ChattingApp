const express = require("express");
const AWS = require("aws-sdk");

const router = express.Router();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const CHATROOM_TABLE = "ChatRooms";
const MESSAGE_TABLE = "Message";

// Lấy thông tin phòng chat theo chatRoomId
router.get("/chatRoom", async (req, res) => {
    try {
        const { chatRoomId } = req.query;
        if (!chatRoomId) {
            return res.status(400).json({ message: "Thiếu chatRoomId!" });
        }

        const params = {
            TableName: CHATROOM_TABLE,
            Key: { chatRoomId }
        };

        const result = await dynamoDB.get(params).promise();
        if (!result.Item) {
            return res.status(404).json({ message: "Không tìm thấy phòng chat!" });
        }

        res.json(result.Item);
    } catch (error) {
        console.error("Lỗi lấy thông tin phòng chat:", error);
        res.status(500).json({ message: "Lỗi server!" });
    }
});

// Lấy tin nhắn theo chatRoomId
router.get("/messages", async (req, res) => {
    try {
        const { chatRoomId } = req.query;
        if (!chatRoomId) {
            return res.status(400).json({ message: "Thiếu chatRoomId!" });
        }

        const params = {
            TableName: MESSAGE_TABLE,
            FilterExpression: "chatRoomId = :chatRoomId",
            ExpressionAttributeValues: { ":chatRoomId": chatRoomId }
        };

        const result = await dynamoDB.scan(params).promise();
        res.json(result.Items);
    } catch (error) {
        console.error("Lỗi lấy tin nhắn:", error);
        res.status(500).json({ message: "Lỗi server!" });
    }
});

// Tạo ChatRoom mới
router.post("/createChatRoom", async (req, res) => {
    try {
      const { chatRoomId, isGroup, participants } = req.body;
  
      // Kiểm tra participants là mảng và có đúng 2 số điện thoại
      if (
        !Array.isArray(participants) ||
        participants.length !== 2 ||
        participants.some((p) => typeof p !== "string" || !p.trim())
      ) {
        return res.status(400).json({ message: "participants phải là mảng gồm 2 số điện thoại hợp lệ!" });
      }
  
      const chatRoomData = {
        chatRoomId,
        isGroup,
        participants,
      };
  
      const params = {
        TableName: CHATROOM_TABLE,
        Item: chatRoomData,
      };
  
      await dynamoDB.put(params).promise();
  
      res.status(201).json({
        message: "ChatRoom đã được tạo thành công!",
        chatRoomId,
      });
    } catch (error) {
      console.error("Lỗi khi tạo ChatRoom:", error);
      res.status(500).json({ message: "Lỗi server!" });
    }
  });
  

module.exports = router;
