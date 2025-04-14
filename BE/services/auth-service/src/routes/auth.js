const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AWS = require("aws-sdk");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const os = require("os");
const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

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

// Hàm lấy IP LAN của máy chủ
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  const targetInterface = interfaces["Wi-Fi"]; // Thay "Wi-Fi" bằng tên giao diện mạng của bạn
  if (targetInterface) {
    for (const config of targetInterface) {
      if (config.family === "IPv4" && !config.internal) {
        return config.address;
      }
    }
  }
  return "localhost"; // Trả về localhost nếu không tìm thấy IP phù hợp
}

const SERVER_IP = getLocalIPAddress();
const SERVER_PORT = 3721;
const BASE_URL = `http://${SERVER_IP}:${SERVER_PORT}`;
console.log("BASE URL: ", BASE_URL);

router.post("/send-confirmation-email", async (req, res) => {
  try {
    const { email, phoneNumber, password, fullName, gender, dob } = req.body;

    if (!email || !phoneNumber || !password || !fullName) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc." });
    }

    // Kiểm tra xem số điện thoại hoặc email đã tồn tại chưa
    const paramsCheck = {
      TableName: TABLE_NAME,
      Key: { phoneNumber },
    };
    const { Item: existingUser } = await dynamoDB.get(paramsCheck).promise();

    if (existingUser) {
      return res.status(400).json({
        message: "Số điện thoại hoặc email đã được đăng ký.",
      });
    }

    // Tạo token chứa thông tin đăng ký
    const confirmationToken = jwt.sign(
      { email, phoneNumber, password, fullName, gender, dob },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Tạo link xác nhận với IP động
    const confirmationLink = `${BASE_URL}/auth/confirm-email?token=${confirmationToken}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Xác nhận đăng ký tài khoản",
      text: `Vui lòng nhấn vào liên kết sau để xác nhận tài khoản của bạn: ${confirmationLink}`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json({
      message: "Vui lòng kiểm tra email để xác nhận tài khoản.",
      success: true,
    });
  } catch (error) {
    console.error("Lỗi khi gửi email xác nhận:", error);
    return res.status(500).json({ message: "Lỗi server.", error });
  }
});

router.get("/confirm-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send("Token không hợp lệ.");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const errorMessage =
        err.name === "TokenExpiredError"
          ? "Token đã hết hạn."
          : "Token không hợp lệ.";
      return res.redirect(
        `${BASE_URL}/auth/confirm-email?status=error&message=Token không hợp lệ hoặc đã hết hạn`
      );
    }

    const { email, phoneNumber, password, fullName, gender, dob } = decoded;

    // Mã hóa mật khẩu và thêm người dùng mới
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      userID: uuidv4(),
      phoneNumber,
      password: hashedPassword,
      fullName,
      email,
      gender: gender || "unknown",
      dob: dob || "unknown",
      avatar: avatar_Default,
      status: "active",
      createAt: new Date().toISOString().split("T")[0],
    };

    const paramsInsert = {
      TableName: TABLE_NAME,
      Item: newUser,
    };

    await dynamoDB.put(paramsInsert).promise();

    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Đăng ký thành công</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background-color: #f4f4f4;
          }
          .container {
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            display: inline-block;
          }
          h1 {
            color: #4CAF50;
          }
          p {
            font-size: 18px;
            color: #333;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Đăng ký thành công!</h1>
          <p>Cảm ơn bạn đã đăng ký. Bạn có thể đăng nhập vào ứng dụng ngay bây giờ.</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Lỗi khi xác nhận tài khoản:", error.message);
    return res.status(500).send("Lỗi server. Vui lòng thử lại sau!");
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
    const resetToken = jwt.sign(
      { userID: user.userID },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

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

    return res
      .status(200)
      .json({ message: "Link đặt lại mật khẩu đã được gửi đến email của bạn" });
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
      return res.status(404).json({ message: "Người dùng không tồn tại" });
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

    return res.status(200).json({ message: "Đặt lại mật khẩu thành công!" });
  } catch (error) {
    console.error("Lỗi khi đặt lại mật khẩu:", error);
    return res.status(500).json({ message: "Lỗi server", error });
  }
});

router.post("/send-reset-link-on-phone", async (req, res) => {
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

    const { Item: user } = await dynamoDB.get(params).promise();

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Tạo token xác nhận đổi mật khẩu
    const resetToken = jwt.sign(
      { userID: user.userID, phoneNumber: user.phoneNumber },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Tạo link đổi mật khẩu
    const resetLink = `${BASE_URL}/auth/reset-password-on-phone?token=${resetToken}&phoneNumber=${phoneNumber}`;

    // Gửi email với link đổi mật khẩu
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Xác nhận đổi mật khẩu",
      text: `Nhấn vào liên kết sau để đổi mật khẩu của bạn: ${resetLink}`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: "Link xác nhận đổi mật khẩu đã được gửi đến email của bạn.",
    });
  } catch (error) {
    console.error("Lỗi khi gửi link xác nhận đổi mật khẩu:", error);
    return res.status(500).json({ message: "Lỗi server", error });
  }
});

router.get("/reset-password-on-phone", async (req, res) => {
  try {
    const { token, phoneNumber } = req.query;

    if (!token || !phoneNumber) {
      return res.status(400).send("Token và số điện thoại là bắt buộc.");
    }

    // Xác minh token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const errorMessage =
        err.name === "TokenExpiredError"
          ? "Token đã hết hạn."
          : "Token không hợp lệ.";
      return res.status(401).send(errorMessage);
    }

    // Kiểm tra xem token có khớp với số điện thoại không
    if (decoded.phoneNumber !== phoneNumber) {
      return res.status(401).send("Token không khớp với số điện thoại.");
    }

    // Trả về giao diện HTML để đổi mật khẩu
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Đổi mật khẩu</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f4f4f4;
          }
          .container {
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
          }
          input {
            width: 100%;
            padding: 10px;
            margin: 10px 0;
            border: 1px solid #ccc;
            border-radius: 4px;
          }
          button {
            width: 100%;
            padding: 10px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          button:hover {
            background-color: #0056b3;
          }
          .error {
            color: red;
            font-size: 14px;
            margin-top: -10px;
            margin-bottom: 10px;
          }
          .success {
            color: green;
            font-size: 14px;
            margin-top: -10px;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Đổi mật khẩu</h2>
          <form id="resetPasswordForm" action="/auth/reset-password-on-phone?token=${token}&phoneNumber=${phoneNumber}" method="POST">
            <label for="newPassword">Mật khẩu mới:</label>
            <input type="password" id="newPassword" name="newPassword" required />
            <label for="confirmPassword">Xác nhận mật khẩu:</label>
            <input type="password" id="confirmPassword" name="confirmPassword" required />
            <p id="message" class=""></p>
            <button type="submit">Đổi mật khẩu</button>
          </form>
        </div>
        <script>
          const form = document.getElementById('resetPasswordForm');
          const messageElement = document.getElementById('message');

          form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(form);
            const newPassword = formData.get('newPassword');
            const confirmPassword = formData.get('confirmPassword');

            if (newPassword !== confirmPassword) {
              messageElement.textContent = "Mật khẩu xác nhận không khớp.";
              messageElement.className = "error";
              return;
            }

            try {
              const response = await fetch(form.action, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  newPassword,
                  confirmPassword,
                }),
              });

              const result = await response.text();

              if (response.ok) {
                messageElement.textContent = result;
                messageElement.className = "success";
                form.reset();
              } else {
                messageElement.textContent = result;
                messageElement.className = "error";
              }
            } catch (error) {
              messageElement.textContent = "Có lỗi xảy ra. Vui lòng thử lại.";
              messageElement.className = "error";
            }
          });
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Lỗi khi xử lý yêu cầu reset mật khẩu:", error);
    return res.status(500).send("Lỗi server. Vui lòng thử lại sau!");
  }
});

router.post("/reset-password-on-phone", async (req, res) => {
  try {
    const { phoneNumber, token } = req.query;
    const { newPassword, confirmPassword } = req.body;

    console.log("Token:", token);
    console.log("PhoneNumber:", phoneNumber);
    console.log("New Password:", newPassword);
    console.log("Confirm Password", confirmPassword);

    if (!phoneNumber || !newPassword || !confirmPassword || !token) {
      return res
        .status(400)
        .send(
          "Số điện thoại, mật khẩu mới, xác nhận mật khẩu và token là bắt buộc."
        );
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).send("Mật khẩu xác nhận không khớp.");
    }

    // Xác minh token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const errorMessage =
        err.name === "TokenExpiredError"
          ? "Token đã hết hạn."
          : "Token không hợp lệ.";
      return res.status(401).send(errorMessage);
    }

    // Kiểm tra xem token có khớp với số điện thoại không
    if (decoded.phoneNumber !== phoneNumber) {
      return res.status(401).send("Token không khớp với số điện thoại.");
    }

    // Truy vấn DynamoDB để tìm user theo phoneNumber
    const params = {
      TableName: TABLE_NAME,
      Key: { phoneNumber },
    };

    const { Item: user } = await dynamoDB.get(params).promise();

    if (!user) {
      return res.status(404).send("Người dùng không tồn tại.");
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

    return res.send("Đổi mật khẩu thành công! Bạn có thể đăng nhập lại.");
  } catch (error) {
    console.error("Lỗi khi đổi mật khẩu:", error);
    return res.status(500).send("Lỗi server. Vui lòng thử lại sau!");
  }
});

module.exports = router;
