const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const router = express.Router();

// Cấu hình AWS DynamoDB
AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "Users";
const avatar_Default = "https://lab2s3aduong.s3.ap-southeast-1.amazonaws.com/man+avatar.png";

router.post("/register", async (req, res) => {
    try {
        const { phoneNumber, password, fullName, email, gender, dob } = req.body;

        if (!phoneNumber || !password || !fullName) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
        }

        // Kiểm tra xem số điện thoại đã tồn tại chưa
        const paramsCheck = {
            TableName: TABLE_NAME,
            Key: { phoneNumber }
        };

        const { Item: existingUser } = await dynamoDB.get(paramsCheck).promise();
        if (existingUser) {
            return res.status(400).json({ message: "Số điện thoại đã được đăng ký!" });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo user mới
        const newUser = {
            userID: uuidv4(),
            phoneNumber,
            password: hashedPassword,
            fullName,
            email: email || "unknown",
            gender: gender || "unknown",
            dob: dob || "unknown",
            avatar: avatar_Default,
            status: "active",
            createAt: new Date().toISOString().split("T")[0],
        };

        // Lưu vào DynamoDB
        const paramsInsert = {
            TableName: TABLE_NAME,
            Item: newUser
        };

        await dynamoDB.put(paramsInsert).promise();

        return res.status(201).json({ message: "Đăng ký thành công!", user: newUser });
    } catch (error) {
        console.error("Lỗi khi đăng ký:", error);
        return res.status(500).json({ message: "Lỗi server", error });
    }
});


router.post("/login", async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;

        if (!phoneNumber || !password) {
            return res.status(400).json({ message: "Số điện thoại và mật khẩu là bắt buộc" });
        }

        // Truy vấn DynamoDB để tìm user theo phoneNumber
        const params = {
            TableName: TABLE_NAME,
            Key: { phoneNumber }
        };

        const { Item: user } = await dynamoDB.get(params).promise();

        if (!user) {
            return res.status(401).json({ message: "Số điện thoại hoặc mật khẩu không đúng" });
        }

        // So sánh mật khẩu đã mã hóa
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Số điện thoại hoặc mật khẩu không đúng" });
        }

        // Tạo token JWT
        const token = jwt.sign(
            { userID: user.userID, phoneNumber: user.phoneNumber },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({ token, user: { userID: user.userID, phoneNumber: user.phoneNumber, fullName: user.fullName, avatar: user.avatar } });
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
});

module.exports = router;
