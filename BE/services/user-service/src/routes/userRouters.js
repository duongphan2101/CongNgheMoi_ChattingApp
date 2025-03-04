const express = require("express");
const jwt = require("jsonwebtoken");
const AWS = require("aws-sdk");
require("dotenv").config();

const router = express.Router();
AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "Users";

router.get("/me", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Không có token!" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Lấy user từ database
        const params = { TableName: TABLE_NAME, Key: { phoneNumber: decoded.phoneNumber } };
        const { Item: user } = await dynamoDB.get(params).promise();

        if (!user) return res.status(404).json({ message: "Không tìm thấy user!" });

        res.json({
            phoneNumber: user.phoneNumber,
            fullName: user.fullName,
            avatar: user.avatar,
            dob: user.dob,
            email: user.email,
            gender: user.gender,
        });
    } catch (error) {
        res.status(401).json({ message: "Token không hợp lệ!" });
    }
});

module.exports = router;