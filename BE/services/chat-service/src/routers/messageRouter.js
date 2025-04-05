const express = require("express");
const AWS = require("aws-sdk");
const Message = require("../models/message");

const router = express.Router();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "Message";

module.exports = (io) => {
router.post("/sendMessage", async (req, res) => {
    try {
        const { chatRoomId, sender, receiver, message} = req.body;

        if (!chatRoomId || !sender || !receiver || !message) {
            console.error("❌ Thiếu dữ liệu từ client:", req.body);
            return res.status(400).json({ error: "Thiếu trường bắt buộc!" });
        }

        const newMessage = new Message(chatRoomId, sender, receiver, message, "text");
        
        const params = {
            TableName: TABLE_NAME,
            Item: newMessage,
        };

        await dynamoDB.put(params).promise();
        console.log("✅ Tin nhắn đã lưu vào DB:", newMessage);

        io.to(chatRoomId).emit("receiveMessage", newMessage);

        res.status(201).json({ message: "Gửi thành công!", data: newMessage });
    } catch (error) {
        console.error("❌ Lỗi khi lưu tin nhắn:", error);
        res.status(500).json({ error: "Lỗi server!" });
    }
});


    return router;
};

