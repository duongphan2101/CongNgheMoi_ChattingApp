const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AWS = require("aws-sdk");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const router = express.Router();

// Cấu hình AWS DynamoDB
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "Users";
const avatar_Default =
  "https://lab2s3aduong.s3.ap-southeast-1.amazonaws.com/man+avatar.png";

router.post("/register", async (req, res) => {
  try {
    const { phoneNumber, password, fullName, email, gender, dob } = req.body;

    if (!phoneNumber || !password || !fullName) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ thông tin!" });
    }

    // Kiểm tra xem số điện thoại đã tồn tại chưa
    const paramsCheck = {
      TableName: TABLE_NAME,
      Key: { phoneNumber },
    };

    const { Item: existingUser } = await dynamoDB.get(paramsCheck).promise();
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Số điện thoại đã được đăng ký!" });
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
      Item: newUser,
    };

    await dynamoDB.put(paramsInsert).promise();

    return res
      .status(201)
      .json({ message: "Đăng ký thành công!", user: newUser });
  } catch (error) {
    console.error("Lỗi khi đăng ký:", error);
    return res.status(500).json({ message: "Lỗi server", error });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res
        .status(400)
        .json({ message: "Số điện thoại và mật khẩu là bắt buộc" });
    }

    // Truy vấn DynamoDB để tìm user theo phoneNumber
    const params = {
      TableName: TABLE_NAME,
      Key: { phoneNumber },
    };

    const { Item: user } = await dynamoDB.get(params).promise();

    if (!user) {
      return res
        .status(401)
        .json({ message: "Số điện thoại hoặc mật khẩu không đúng" });
    }

    // So sánh mật khẩu đã mã hóa
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Số điện thoại hoặc mật khẩu không đúng" });
    }

    // Tạo token JWT
    const token = jwt.sign(
      { userID: user.userID, phoneNumber: user.phoneNumber },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        userID: user.userID,
        phoneNumber: user.phoneNumber,
        fullName: user.fullName,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/send-reset-link", async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Số điện thoại là bắt buộc" });
    }

    // Truy vấn DynamoDB để tìm user theo phoneNumber
    const params = {
      TableName: TABLE_NAME,
      Key: { phoneNumber },
    };

    console.log("DynamoDB query params:", params);

    const { Item: user } = await dynamoDB.get(params).promise();

    console.log("DynamoDB query result:", user);

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Generate a reset token (for simplicity, using userID)
    const resetToken = jwt.sign({ userID: user.userID }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Send email with reset link
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}&phoneNumber=${phoneNumber}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Reset Password",
      text: `Click the link to reset your password: ${resetLink}`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "Link đặt lại mật khẩu đã được gửi đến email của bạn" });
  } catch (error) {
    console.error("Lỗi khi gửi link đặt lại mật khẩu:", error);
    return res.status(500).json({ message: "Lỗi server", error });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { phoneNumber, newPassword } = req.body;

    if (!phoneNumber || !newPassword) {
      return res
        .status(400)
        .json({ message: "Số điện thoại và mật khẩu mới là bắt buộc" });
    }

    // Truy vấn DynamoDB để tìm user theo phoneNumber
    const params = {
      TableName: TABLE_NAME,
      Key: { phoneNumber },
    };

    // console.log("DynamoDB query params:", params);

    const { Item: user } = await dynamoDB.get(params).promise();

    // console.log("DynamoDB query result:", user);

    if (!user) {
      return res
        .status(404)
        .json({ message: "Người dùng không tồn tại" });
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu mới trong DynamoDB
    const paramsUpdate = {
      TableName: TABLE_NAME,
      Key: { phoneNumber },
      UpdateExpression: "set #password = :password",
      ExpressionAttributeNames: {
        "#password": "password",
      },
      ExpressionAttributeValues: {
        ":password": hashedPassword,
      },
    };

    await dynamoDB.update(paramsUpdate).promise();

    return res
      .status(200)
      .json({ message: "Đặt lại mật khẩu thành công!" });
  } catch (error) {
    console.error("Lỗi khi đặt lại mật khẩu:", error);
    return res.status(500).json({ message: "Lỗi server", error });
  }
});

module.exports = router;
