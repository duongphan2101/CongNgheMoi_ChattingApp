const express = require("express");
const jwt = require("jsonwebtoken");
const AWS = require("aws-sdk");
const bcrypt = require("bcryptjs"); 
const multer = require("multer");
require("dotenv").config();

const router = express.Router();

AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "Users";
const s3 = new AWS.S3();

const upload = multer({
    storage: multer.memoryStorage(), // Lưu file vào bộ nhớ tạm thời
    limits: { fileSize: 1 * 1024 * 1024 }, // Giới hạn 1MB
});

//  API: Lấy thông tin user
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

//  API: Cập nhật thông tin user
router.put("/update", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Không có token!" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const phoneNumber = decoded.phoneNumber;

        const { fullName, dob, gender, email } = req.body;
        if (!fullName && !dob && !gender && !email) {
            return res.status(400).json({ message: "Không có dữ liệu để cập nhật!" });
        }

        let updateExp = [];
        let expAttrValues = {};

        if (fullName) {
            updateExp.push("fullName = :fullName");
            expAttrValues[":fullName"] = fullName;
        }
        if (dob) {
            updateExp.push("dob = :dob");
            expAttrValues[":dob"] = dob;
        }
        if (gender) {
            updateExp.push("gender = :gender");
            expAttrValues[":gender"] = gender;
        }
        if (email) {
            updateExp.push("email = :email");
            expAttrValues[":email"] = email;
        }

        if (updateExp.length === 0) {
            return res.status(400).json({ message: "Không có dữ liệu hợp lệ để cập nhật!" });
        }

        const params = {
            TableName: TABLE_NAME,
            Key: { phoneNumber },
            UpdateExpression: "set " + updateExp.join(", "),
            ExpressionAttributeValues: expAttrValues,
            ReturnValues: "ALL_NEW",
        };

        const result = await dynamoDB.update(params).promise();
        res.json({ message: "Cập nhật thành công!", user: result.Attributes });
    } catch (error) {
        console.error("Lỗi cập nhật:", error);
        res.status(500).json({ message: "Lỗi server!" });
    }
});

//  API: Cập nhật avatar user
router.put("/update-avatar", upload.single("avatar"), async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Không có token!" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const phoneNumber = decoded.phoneNumber;

        const avatarFile = req.file;
        if (!avatarFile) {
            return res.status(400).json({ message: "Vui lòng chọn ảnh!" });
        }

        const fileExtension = avatarFile.mimetype.split("/")[1];
        const fileName = `${phoneNumber}-${Date.now()}.${fileExtension}`;
        const s3Params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileName,
            Body: avatarFile.buffer,
            ContentType: avatarFile.mimetype,
            ACL: "public-read",
        };

        const s3Response = await s3.upload(s3Params).promise();
        const avatarUrl = s3Response.Location;
        console.log("Ảnh upload thành công, URL:", avatarUrl);

        const updateParams = {
            TableName: TABLE_NAME,
            Key: { phoneNumber },
            UpdateExpression: "set avatar = :avatar",
            ExpressionAttributeValues: { ":avatar": avatarUrl },
            ReturnValues: "ALL_NEW",
        };

        const result = await dynamoDB.update(updateParams).promise();
        res.json({ message: "Cập nhật avatar thành công!", user: result.Attributes });
    } catch (error) {
        console.error("Lỗi cập nhật avatar:", error);
        res.status(500).json({ message: "Lỗi server!", error: error.message });
    }
});

//  API: Đổi mật khẩu
router.post("/change-passwordSetting", async (req, res) => {
    try {
        console.log("Received Headers:", req.headers);

        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: "Không có token!" });
        }

        const token = authHeader.split(" ")[1];
        console.log("Extracted Token:", token);

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("Decoded Token:", decoded);
        } catch (error) {
            return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
        }

        const phoneNumber = decoded.phoneNumber;
        console.log("PhoneNumber from Token:", phoneNumber);

        const { oldPassword, newPassword } = req.body;

      
        const params = {
            TableName: TABLE_NAME,
            Key: { phoneNumber }
        };
        const { Item: user } = await dynamoDB.get(params).promise();

        if (!user) {
            return res.status(404).json({ message: "User không tồn tại!" });
        }


        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Mật khẩu cũ không đúng!" });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        const updateParams = {
            TableName: TABLE_NAME,
            Key: { phoneNumber },
            UpdateExpression: "set password = :password",
            ExpressionAttributeValues: { ":password": hashedNewPassword },
            ReturnValues: "ALL_NEW",
        };
        await dynamoDB.update(updateParams).promise();
        

        return res.status(200).json({ message: "Đổi mật khẩu thành công!" });
    } catch (error) {
        console.error("Lỗi đổi mật khẩu:", error);
        res.status(500).json({ message: "Lỗi server!", error: error.message });
    }
});


module.exports = router;
