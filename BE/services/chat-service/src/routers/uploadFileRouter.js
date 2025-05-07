const express = require("express");
const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");
const Message = require("../models/message");

const router = express.Router();
const TABLE_NAME = "Message";
const TABLE_CONVERSATION_NAME = "Conversations";
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "lab2s3aduong";

const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

s3.listBuckets((err, data) => {
    if (err) {
        console.error("Lỗi kết nối đến S3:", err);
    } else {
        console.log("Kết nối đến S3 thành công. Danh sách các bucket hiện có:", data.Buckets.map(b => b.Name));
    }
});

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: BUCKET_NAME,
        acl: "public-read",
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
            const fileName = `uploads/${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
            cb(null, fileName);
        }
    }),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /\.?(jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|txt|mp3|mp4|m4a)$/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

        if (extname) {
            return cb(null, true);
        } else {
            cb(new Error('Định dạng file không được hỗ trợ.'));
        }
    }
}).array('files', 10);

module.exports = (io, redisPublisher) => {
    // Middleware xử lý lỗi multer
    const handleMulterError = (err, req, res, next) => {
        if (err) {
            console.error("Lỗi multer:", err);

            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    error: "Kích thước file vượt quá giới hạn 10MB. Vui lòng chọn file nhỏ hơn.",
                    code: "FILE_TOO_LARGE"
                });
            }

            return res.status(400).json({
                error: err.message || "Tải file lên thất bại",
                code: "UPLOAD_ERROR"
            });
        }
        next();
    };

    const isUserOnline = (userId) => {
        // Thay thế bằng logic kiểm tra trạng thái đăng nhập thực tế
        return io.sockets.adapter.rooms.has(userId);
    };

    // Route upload file
    router.post("/uploadFile", upload, handleMulterError, async (req, res) => {
        try {
            console.log("Nhận yêu cầu tải file lên");
    
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: "Không có file nào được tải lên!" });
            }
    
            const { chatRoomId, sender, receiver, chatId } = req.body;
            console.log("Chat id ", chatId)
    
            if (!chatRoomId || !sender || !receiver) {
                return res.status(400).json({
                    error: "Thiếu thông tin bắt buộc!",
                    fields: { chatRoomId, sender, receiver }
                });
            }
    
            console.log(`Tải ${req.files.length} file lên thành công`);
    
            const uploadedMessages = [];
    
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
            const unreadFor = participants.filter((p) => p !== sender);
            const currentUnreadList = conversationData.Item.isUnreadBy || [];
            const updatedUnreadList = Array.from(new Set([...currentUnreadList, ...unreadFor]));
    
            // Xử lý từng file và tạo tin nhắn cho mỗi file
            for (const file of req.files) {
                const fileInfo = {
                    name: file.originalname,
                    url: file.location,
                    size: file.size,
                    type: file.mimetype
                };
    
                const newMessage = new Message(
                    chatRoomId,
                    sender,
                    receiver,
                    JSON.stringify(fileInfo),
                    "file"
                );
    
                const params = {
                    TableName: TABLE_NAME,
                    Item: newMessage,
                };
    
                await dynamoDB.put(params).promise();
                uploadedMessages.push(newMessage);
                
                // Emit mỗi tin nhắn qua socket
                io.to(chatRoomId).emit("receiveMessage", newMessage);
                
                // Publish thông báo cho mỗi file
                const notifyPayload = JSON.stringify({
                    type: "file",
                    to: receiver,
                    from: sender,
                    newMessage,
                    timestamp: newMessage.timestamp,
                });
    
                redisPublisher.publish("notifications", notifyPayload);
            }
    
            // Cập nhật cuộc trò chuyện với tin nhắn cuối
            const fileCountText = req.files.length > 1 
                ? `Đã gửi ${req.files.length} file` 
                : "Vừa nhận được file";
                
            const updateParams = {
                TableName: TABLE_CONVERSATION_NAME,
                Key: { chatId },
                UpdateExpression: "SET lastMessage = :lastMessage, lastMessageAt = :lastMessageAt, isUnreadBy = :updatedUnreadList",
                ExpressionAttributeValues: {
                    ":lastMessage": fileCountText,
                    ":lastMessageAt": new Date().toLocaleDateString(
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
            console.log(`✅ Lưu ${req.files.length} tin nhắn file vào DB`);
    
            res.status(201).json({
                message: `Tải ${req.files.length} file lên thành công!`,
                data: uploadedMessages
            });
        } catch (error) {
            console.error("❌ Lỗi khi lưu tin nhắn file:", error);
            res.status(500).json({
                error: "Lỗi Server khi xử lý file!",
                details: error.message
            });
        }
    });    

    return router;
};