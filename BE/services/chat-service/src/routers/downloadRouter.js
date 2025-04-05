const express = require("express");
const AWS = require("aws-sdk");
const https = require('https');
const router = express.Router();

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const TABLE_NAME = "Message";
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "lab2s3aduong";

// Hàm tiện ích để trích xuất key từ URL S3
const extractKeyFromUrl = (url) => {
    const urlParts = url.split('/');
    let key = urlParts.slice(3).join('/');

    if (key.indexOf('amazonaws.com/') > -1) {
        key = key.split('amazonaws.com/')[1];
    }
    return key;
};

// Route xem file (chủ yếu dành cho hình ảnh)
router.get("/view/:chatRoomId/:messageId", async (req, res) => {
    try {
    const { chatRoomId, messageId } = req.params;
    
    // Lấy thông tin tin nhắn từ DynamoDB
    const params = {
        TableName: TABLE_NAME,
        Key: {
        chatRoomId: chatRoomId,
        timestamp: parseInt(messageId)
        }
    };
    
    const result = await dynamoDB.get(params).promise();
    
    if (!result.Item) {
        return res.status(404).json({ error: "Không tìm thấy file" });
    }
    
    const message = result.Item;
    if (message.type !== "file") {
        return res.status(400).json({ error: "Tin nhắn không phải là file" });
    }
    
    const fileInfo = JSON.parse(message.message);
    const fileUrl = fileInfo.url;
    const key = extractKeyFromUrl(fileUrl);
    
    // Stream file từ S3
    const s3Params = {
        Bucket: BUCKET_NAME,
        Key: key
    };
    
    const s3Stream = s3.getObject(s3Params).createReadStream();
    
    // Set Content-Type để trình duyệt hiển thị đúng
    res.setHeader('Content-Type', fileInfo.type);
    
    // Pipe stream từ S3 tới response
    s3Stream.pipe(res);
    
    } catch (error) {
        console.error("❌ Lỗi khi xem file:", error);
        res.status(500).json({ error: "Lỗi server khi xem file" });
    }
});

// Route tải xuống file
router.get("/download/:chatRoomId/:messageId", async (req, res) => {
    try {
    const { chatRoomId, messageId } = req.params;
    
    // Lấy thông tin tin nhắn từ DynamoDB
    const params = {
        TableName: TABLE_NAME,
        Key: {
            chatRoomId: chatRoomId,
            timestamp: parseInt(messageId)
        }
    };
    
    const result = await dynamoDB.get(params).promise();
    
    if (!result.Item) {
        return res.status(404).json({ error: "Không tìm thấy file" });
    }
    
    const message = result.Item;
    if (message.type !== "file") {
        return res.status(400).json({ error: "Tin nhắn không phải là file" });
    }
    
    const fileInfo = JSON.parse(message.message);
    const fileUrl = fileInfo.url;
    const key = extractKeyFromUrl(fileUrl);
    
    // Stream file từ S3
    const s3Params = {
        Bucket: BUCKET_NAME,
        Key: key
    };
    
    // Lấy thông tin file từ S3
    const headParams = {
        Bucket: BUCKET_NAME,
        Key: key
    };
    
    // Set headers cho việc tải xuống
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileInfo.name)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Stream file từ S3 tới response
    const s3Stream = s3.getObject(s3Params).createReadStream();
    s3Stream.pipe(res);
    
    } catch (error) {
        console.error("❌ Lỗi khi tải file:", error);
        res.status(500).json({ error: "Lỗi server khi tải file" });
    }
});

module.exports = router;