const express = require("express");
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const CHATROOM_TABLE = "ChatRooms";
const MESSAGE_TABLE = "Message";

// Lấy thông tin phòng chat theo chatRoomId
router.get("/chatRoom", async (req, res) => {
  try {
    const { chatRoomId } = req.query;
    if (!chatRoomId) {
      return res.status(400).json({ message: "Thiếu chatRoomId!" });
    }

    const params = {
      TableName: CHATROOM_TABLE,
      Key: { chatRoomId }
    };

    const result = await dynamoDB.get(params).promise();
    if (!result.Item) {
      return res.status(404).json({ message: "Không tìm thấy phòng chat!" });
    }

    res.json(result.Item);
  } catch (error) {
    console.error("Lỗi lấy thông tin phòng chat:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

// Lấy tin nhắn theo chatRoomId
router.get("/messages", async (req, res) => {
  try {
    const { chatRoomId } = req.query;
    if (!chatRoomId) {
      return res.status(400).json({ message: "Thiếu chatRoomId!" });
    }

    const params = {
      TableName: MESSAGE_TABLE,
      FilterExpression: "chatRoomId = :chatRoomId",
      ExpressionAttributeValues: { ":chatRoomId": chatRoomId }
    };

    const result = await dynamoDB.scan(params).promise();
    res.json(result.Items);
  } catch (error) {
    console.error("Lỗi lấy tin nhắn:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

// Tạo ChatRoom mới
router.post("/createChatRoom", async (req, res) => {
  try {
    const { chatRoomId, isGroup, participants } = req.body;

    // Kiểm tra participants là mảng và có đúng 2 số điện thoại
    if (
      !Array.isArray(participants) ||
      participants.length !== 2 ||
      participants.some((p) => typeof p !== "string" || !p.trim())
    ) {
      return res.status(400).json({ message: "participants phải là mảng gồm 2 số điện thoại hợp lệ!" });
    }

    const chatRoomData = {
      chatRoomId,
      isGroup,
      participants,
    };

    const params = {
      TableName: CHATROOM_TABLE,
      Item: chatRoomData,
    };

    await dynamoDB.put(params).promise();

    res.status(201).json({
      message: "ChatRoom đã được tạo thành công!",
      chatRoomId,
    });
  } catch (error) {
    console.error("Lỗi khi tạo ChatRoom:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

// Tạo Chat Room cho Group
router.post("/createChatRoomForGroup", async (req, res) => {
  try {
    const { nameGroup, createdBy, participants, admin } = req.body;

    const avatar = 'https://lab2s3aduong.s3.ap-southeast-1.amazonaws.com/uploads/1744906183412_icon-vchat.png';

    if (
      !Array.isArray(participants) ||
      participants.length < 3 ||
      participants.some((p) => typeof p !== "string" || !p.trim())
    ) {
      return res.status(400).json({ message: "participants phải là mảng gồm ít nhất 3 số điện thoại hợp lệ!" });
    }

    if (!nameGroup || typeof nameGroup !== "string") {
      return res.status(400).json({ message: "Tên nhóm không hợp lệ!" });
    }

    if (!createdBy || typeof createdBy !== "string") {
      return res.status(400).json({ message: "Trường createdBy là bắt buộc!" });
    }

    const generateUniqueChatRoomId = async () => {
      let chatRoomId;
      let exists = true;

      while (exists) {
        const randomNum = Math.floor(10000 + Math.random() * 90000); // 5 số
        chatRoomId = "C" + randomNum;

        const checkParams = {
          TableName: CHATROOM_TABLE,
          Key: { chatRoomId },
        };

        const result = await dynamoDB.get(checkParams).promise();
        exists = !!result.Item;
      }

      return chatRoomId;
    };

    const chatRoomId = await generateUniqueChatRoomId();

    const chatRoomData = {
      chatRoomId,
      isGroup: true,
      nameGroup,
      createdBy,
      participants,
      avatar,
      admin,
      createdAt: new Date().toISOString().split("T")[0],
    };

    await dynamoDB.put({
      TableName: CHATROOM_TABLE,
      Item: chatRoomData,
    }).promise();

  
    const chatId = uuidv4();

    const conversationData = {
      chatId,
      chatRoomId,
      isGroup: true,
      participants,
      isUnreadBy: [],
      lastMessage: "",
      lastMessageAt: null,
      avatar,
      fullName: nameGroup
    };

    await dynamoDB.put({
      TableName: "Conversations",
      Item: conversationData,
    }).promise();

    res.status(201).json({
      message: "Group ChatRoom và Conversation đã được tạo thành công!",
      chatRoomId,
      chatId,
    });

  } catch (error) {
    console.error("Lỗi khi tạo Group ChatRoom hoặc Conversation:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

// Cập nhật tên nhóm ở cả ChatRoom và Conversation
router.put("/updateChatRoom/:id", async (req, res) => {
  const { nameGroup } = req.body;

  if (!nameGroup || typeof nameGroup !== "string") {
    return res.status(400).json({ message: "Tên nhóm không hợp lệ." });
  }

  try {
    // Cập nhật ChatRoom
    const updatedChatRoom = await ChatRoom.findByIdAndUpdate(
      req.params.id,
      { nameGroup },
      { new: true }
    );

    if (!updatedChatRoom) {
      return res.status(404).json({ message: "Không tìm thấy nhóm." });
    }

    // Cập nhật Conversation (nếu có)
    await Conversation.findOneAndUpdate(
      { chatRoomId: req.params.id },
      { fullName: nameGroup }
    );

    res.json(updatedChatRoom);
  } catch (err) {
    console.error("Lỗi cập nhật tên nhóm:", err);
    res.status(500).json({ message: "Lỗi server khi cập nhật tên nhóm." });
  }
});

// 2. Thêm thành viên vào nhóm
router.put("/:id/add-members", async (req, res) => {
  const { addMembers } = req.body;

  if (!Array.isArray(addMembers)) {
    return res.status(400).json({ message: "Danh sách thành viên không hợp lệ." });
  }

  try {
    const updated = await ChatRoom.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { participants: { $each: addMembers } } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Không tìm thấy nhóm." });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Xóa thành viên khỏi nhóm
// router.put("/:id/remove-members", async (req, res) => {
//   const { removeMembers } = req.body;

//   if (!Array.isArray(removeMembers)) {
//     return res.status(400).json({ message: "Danh sách cần xoá không hợp lệ." });
//   }

//   try {
//     const updated = await ChatRoom.findByIdAndUpdate(
//       req.params.id,
//       { $pull: { participants: { $in: removeMembers } } },
//       { new: true }
//     );
//     if (!updated) return res.status(404).json({ message: "Không tìm thấy nhóm." });
//     res.json(updated);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// 4. Cập nhật avatar nhóm
// router.put("/:id/avatar", async (req, res) => {
//   const { avatar } = req.body;

//   if (!avatar || typeof avatar !== "string") {
//     return res.status(400).json({ message: "Ảnh đại diện không hợp lệ." });
//   }

//   try {
//     const updated = await ChatRoom.findByIdAndUpdate(
//       req.params.id,
//       { avatar },
//       { new: true }
//     );
//     if (!updated) return res.status(404).json({ message: "Không tìm thấy nhóm." });
//     res.json(updated);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });


module.exports = router;
