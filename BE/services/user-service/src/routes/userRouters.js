const express = require("express");
const jwt = require("jsonwebtoken");
const AWS = require("aws-sdk");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const socketIO = require('socket.io');
require("dotenv").config();

const router = express.Router();
const io = socketIO();

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "Users";
const s3 = new AWS.S3();

const upload = multer({
  storage: multer.memoryStorage(), // Lưu file vào bộ nhớ tạm thời
  limits: { fileSize: 1 * 1024 * 1024 }, // Giới hạn 1MB
});

const generateRequestId = () => {
  const randomNumber = Math.floor(100 + Math.random() * 900); // Tạo số ngẫu nhiên từ 100 đến 999
  return `R${randomNumber}`;
};

//  API: Lấy thông tin user
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Không có token!" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lấy user từ database
    const params = {
      TableName: TABLE_NAME,
      Key: { phoneNumber: decoded.phoneNumber },
    };
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
      return res
        .status(400)
        .json({ message: "Không có dữ liệu hợp lệ để cập nhật!" });
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
    res.json({
      message: "Cập nhật avatar thành công!",
      user: result.Attributes,
    });
  } catch (error) {
    console.error("Lỗi cập nhật avatar:", error);
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
});

//  API: Đổi mật khẩu
router.post("/change-passwordSetting", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Không có token!" });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res
        .status(401)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
    }

    const phoneNumber = decoded.phoneNumber;

    const { oldPassword, newPassword } = req.body;

    const params = {
      TableName: TABLE_NAME,
      Key: { phoneNumber },
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
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
});

router.get("/searchUser", async (req, res) => {
  try {
    const { phoneNumber, fullName } = req.query;

    if (!phoneNumber && !fullName) {
      return res.status(400).json({ error: "Thiếu thông tin tìm kiếm!" });
    }

    const params = {
      TableName: TABLE_NAME,
      FilterExpression: "phoneNumber = :phone OR fullName = :name",
      ExpressionAttributeValues: {
        ":phone": phoneNumber || "NULL",
        ":name": fullName || "NULL",
      },
    };

    const users = await dynamoDB.scan(params).promise();

    if (!users.Items || users.Items.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy user!" });
    }

    res.json(users.Items);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!" });
  }
});

router.get("/friendRequests", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Không có token!" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const receiverPhone = decoded.phoneNumber;

    const params = {
      TableName: "FriendRequests",
      FilterExpression: "receiverPhone = :receiverPhone AND #status = :status",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":receiverPhone": receiverPhone,
        ":status": "PENDING",
      },
    };

    const result = await dynamoDB.scan(params).promise();
    res.status(200).json(result.Items);
  } catch (error) {
    console.error("Lỗi lấy danh sách lời mời kết bạn:", error);
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
});

// API: Gửi yêu cầu kết bạn
router.post("/sendFriendRequest", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Không có token!" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const senderPhone = decoded.phoneNumber;

    const { receiverPhone } = req.body;
    if (!receiverPhone) {
      return res
        .status(400)
        .json({ message: "Thiếu số điện thoại người nhận!" });
    }

    const requestId = generateRequestId();
    const params = {
      TableName: "FriendRequests",
      Item: {
        RequestId: requestId,
        senderPhone,
        receiverPhone,
        status: "PENDING",
        createdAt: new Date().toISOString(),
      },
    };

    await dynamoDB.put(params).promise();

    // Gửi sự kiện realtime
    io.emit('newFriendRequest', {
      RequestId: requestId,
      senderPhone,
      receiverPhone,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    });

    res
      .status(200)
      .json({ message: "Gửi yêu cầu kết bạn thành công!", requestId });
  } catch (error) {
    console.error("Lỗi gửi yêu cầu kết bạn:", error);
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
});

// API: Chấp nhận yêu cầu kết bạn
router.post("/acceptFriendRequest", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Không có token!" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const receiverPhone = decoded.phoneNumber;

    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({ message: "Thiếu RequestId!" });
    }

    // Lấy thông tin yêu cầu kết bạn
    const getRequestParams = {
      TableName: "FriendRequests",
      Key: { RequestId: requestId },
    };
    const { Item: friendRequest } = await dynamoDB
      .get(getRequestParams)
      .promise();

    if (!friendRequest || friendRequest.receiverPhone !== receiverPhone) {
      return res
        .status(404)
        .json({ message: "Yêu cầu kết bạn không tồn tại hoặc không hợp lệ!" });
    }

    if (friendRequest.status !== "PENDING") {
      return res
        .status(400)
        .json({ message: "Yêu cầu kết bạn đã được xử lý!" });
    }

    // Cập nhật trạng thái yêu cầu kết bạn
    const updateRequestParams = {
      TableName: "FriendRequests",
      Key: { RequestId: requestId },
      UpdateExpression: "SET #status = :status",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": "ACCEPTED" },
    };

    await dynamoDB.update(updateRequestParams).promise();

    // Thêm bạn bè vào danh sách bạn bè của cả hai người
    const addFriendToReceiverParams = {
      TableName: "Users",
      Key: { phoneNumber: receiverPhone },
      UpdateExpression:
        "SET friends = list_append(if_not_exists(friends, :emptyList), :newFriend)",
      ExpressionAttributeValues: {
        ":emptyList": [],
        ":newFriend": [friendRequest.senderPhone],
      },
    };

    const addFriendToSenderParams = {
      TableName: "Users",
      Key: { phoneNumber: friendRequest.senderPhone },
      UpdateExpression:
        "SET friends = list_append(if_not_exists(friends, :emptyList), :newFriend)",
      ExpressionAttributeValues: {
        ":emptyList": [],
        ":newFriend": [receiverPhone],
      },
    };

    await Promise.all([
      dynamoDB.update(addFriendToReceiverParams).promise(),
      dynamoDB.update(addFriendToSenderParams).promise(),
    ]);

    // // Gửi sự kiện realtime
    // io.emit('friendRequestAccepted', {
    //   RequestId: requestId,
    //   senderPhone: friendRequest.senderPhone,
    //   receiverPhone: friendRequest.receiverPhone,
    // });

    res.status(200).json({ message: "Chấp nhận yêu cầu kết bạn thành công!" });
  } catch (error) {
    console.error("Lỗi chấp nhận yêu cầu kết bạn:", error);
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
});

// API: Từ chối yêu cầu kết bạn
router.post("/rejectFriendRequest", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Không có token!" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const receiverPhone = decoded.phoneNumber;

    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({ message: "Thiếu RequestId!" });
    }

    // Lấy thông tin yêu cầu kết bạn
    const getRequestParams = {
      TableName: "FriendRequests",
      Key: { RequestId: requestId },
    };
    const { Item: friendRequest } = await dynamoDB
      .get(getRequestParams)
      .promise();

    if (!friendRequest || friendRequest.receiverPhone !== receiverPhone) {
      return res
        .status(404)
        .json({ message: "Yêu cầu kết bạn không tồn tại hoặc không hợp lệ!" });
    }

    if (friendRequest.status !== "PENDING") {
      return res
        .status(400)
        .json({ message: "Yêu cầu kết bạn đã được xử lý!" });
    }

    // Cập nhật trạng thái yêu cầu kết bạn thành "REJECTED"
    const updateRequestParams = {
      TableName: "FriendRequests",
      Key: { RequestId: requestId },
      UpdateExpression: "SET #status = :status",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": "REJECTED" },
    };

    await dynamoDB.update(updateRequestParams).promise();

  } catch (error) {
    console.error("Lỗi từ chối yêu cầu kết bạn:", error);
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
});

router.get("/friends", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Không có token!" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const phoneNumber = decoded.phoneNumber;

    // Lấy danh sách bạn bè từ bảng Users
    const params = {
      TableName: TABLE_NAME,
      Key: { phoneNumber },
    };

    const { Item: user } = await dynamoDB.get(params).promise();

    if (!user || !user.friends || user.friends.length === 0) {
      return res.status(404).json({ message: "Không có bạn bè nào!" });
    }

    // Lấy thông tin chi tiết của từng bạn bè
    const friendDetailsPromises = user.friends.map(async (friendPhone) => {
      const friendParams = {
        TableName: TABLE_NAME,
        Key: { phoneNumber: friendPhone },
      };
      const { Item: friend } = await dynamoDB.get(friendParams).promise();
      return friend
        ? {
            phoneNumber: friend.phoneNumber,
            fullName: friend.fullName || "Không rõ", // Giá trị mặc định nếu thiếu fullName
            avatar: friend.avatar || "default-avatar.png",
          }
        : null;
    });

    const friendDetails = await Promise.all(friendDetailsPromises);

    // Loại bỏ các bạn bè không tồn tại
    const validFriends = friendDetails.filter((friend) => friend !== null);

    res.status(200).json(validFriends);
  } catch (error) {
    console.error("Lỗi lấy danh sách bạn bè:", error);
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
});

// API: Hủy kết bạn
router.post("/unfriend", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Không có token!" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUserPhone = decoded.phoneNumber;

    const { friendPhone } = req.body;
    if (!friendPhone) {
      return res.status(400).json({ message: "Thiếu số điện thoại người bạn!" });
    }

    // Lấy danh sách bạn bè của người dùng hiện tại
    const getCurrentUserParams = {
      TableName: "Users",
      Key: { phoneNumber: currentUserPhone },
    };
    const { Item: currentUser } = await dynamoDB.get(getCurrentUserParams).promise();

    if (!currentUser || !currentUser.friends || !currentUser.friends.includes(friendPhone)) {
      return res.status(404).json({ message: "Người này không phải là bạn của bạn!" });
    }

    // Lấy danh sách bạn bè của người bạn
    const getFriendParams = {
      TableName: "Users",
      Key: { phoneNumber: friendPhone },
    };
    const { Item: friend } = await dynamoDB.get(getFriendParams).promise();

    if (!friend || !friend.friends || !friend.friends.includes(currentUserPhone)) {
      return res.status(404).json({ message: "Người này không phải là bạn của bạn!" });
    }

    // Xóa bạn bè khỏi danh sách của người dùng hiện tại
    const updateCurrentUserParams = {
      TableName: "Users",
      Key: { phoneNumber: currentUserPhone },
      UpdateExpression: "SET friends = :friends",
      ExpressionAttributeValues: {
        ":friends": currentUser.friends.filter(phone => phone !== friendPhone)
      },
    };

    // Xóa bạn bè khỏi danh sách của người bạn
    const updateFriendParams = {
      TableName: "Users",
      Key: { phoneNumber: friendPhone },
      UpdateExpression: "SET friends = :friends",
      ExpressionAttributeValues: {
        ":friends": friend.friends.filter(phone => phone !== currentUserPhone)
      },
    };

    await Promise.all([
      dynamoDB.update(updateCurrentUserParams).promise(),
      dynamoDB.update(updateFriendParams).promise()
    ]);

  } catch (error) {
    console.error("Lỗi hủy kết bạn:", error);
    res.status(500).json({ message: "Lỗi server!", error: error.message });
  }
});

module.exports = router;
