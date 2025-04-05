const express = require("express");
const AWS = require("aws-sdk");
const Message = require("../models/message");

const router = express.Router();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const TABLE_NAME = "Message";
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "lab2s3aduong";

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

router.delete("/deleteMessage", async (req, res) => {
    try {
        const {chatRoomId, messageId} = req.body;

        if (!chatRoomId || !messageId) {
            return res.status(400).json({ error: "Thiếu chatRoomId hoặc messageId!" });
        }

        const getParams = {
            TableName: TABLE_NAME,
            Key: {
                chatRoomId: chatRoomId,
                timestamp: messageId
            }
        };

        const messageResult = await dynamoDB.get(getParams).promise();
        const message = messageResult.Item;
        
        // Nếu là tin nhắn loại file, xóa file khỏi S3
        if (message && message.type === "file") {
            try {
                const fileInfo = JSON.parse(message.message);
                const fileUrl = fileInfo.url;
                const urlParts = fileUrl.split('/');
                let key = urlParts.slice(3).join('/');
                
                if (key.indexOf('amazonaws.com/') > -1) {
                    key = key.split('amazonaws.com/')[1];
                }
                
                console.log("Đang xóa file với key:", key);
                
                // Xóa file từ S3
                const deleteParams = {
                    Bucket: BUCKET_NAME,
                    Key: key
                };
                
                await s3.deleteObject(deleteParams).promise();
                console.log("✅ Đã xóa file từ S3 thành công");
            } catch (fileError) {
                console.error("❌ Lỗi khi xóa file từ S3:", fileError);
            }
        }

        // Xóa tin nhắn từ DynamoDB
        const deleteParams = {
            TableName: TABLE_NAME,
            Key: {
                chatRoomId: chatRoomId,
                timestamp: messageId
            }
        };

        await dynamoDB.delete(deleteParams).promise();
        console.log("✅ Đã xóa tin nhắn:", messageId);

        io.to(chatRoomId).emit("messageDeleted", { messageId });

        res.status(200).json({message: "Xóa tin nhắn thành công!"});
    } catch (error) {
        console.error("❌ Lỗi khi xóa tin nhắn:", error);
        res.status(500).json({ error: "Lỗi server!" });
    }
});

    return router;
};