module.exports = (io, redisPublisher) => {
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

  //check chatRoom = 2 sdt (single chat)
  router.get('/checkChatRoom', async (req, res) => {
    const { myPhone, userPhone } = req.query;

    if (!myPhone || !userPhone) {
      return res.status(400).json({ error: 'Missing phone numbers' });
    }

    try {
      const params = {
        TableName: CHATROOM_TABLE,
        FilterExpression: 'isGroup = :isGroup AND contains(participants, :myPhone) AND contains(participants, :userPhone)',
        ExpressionAttributeValues: {
          ':isGroup': { BOOL: false },
          ':myPhone': { S: myPhone },
          ':userPhone': { S: userPhone }
        }
      };

      const command = new ScanCommand(params);
      const result = await dynamoClient.send(command);

      const exactMatch = result.Items.find(item => {
        const phones = item.participants.L.map(p => p.S);
        return phones.length === 2 &&
          phones.includes(myPhone) &&
          phones.includes(userPhone);
      });

      if (exactMatch) {
        res.json({ chatRoomId: exactMatch.chatRoomId.S });
      } else {
        res.json({ chatRoomId: null });
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra phòng chat:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/getChatIdFromRoom', async (req, res) => {
    const { chatRoomId } = req.query;

    if (!chatRoomId) {
      return res.status(400).json({ error: 'Missing chatRoomId' });
    }

    try {
      const params = {
        TableName: "Conversations",
        FilterExpression: "chatRoomId = :chatRoomId",
        ExpressionAttributeValues: {
          ":chatRoomId": chatRoomId
        }
      };

      const result = await dynamoDB.scan(params).promise();

      if (result.Items && result.Items.length > 0) {
        const chatId = result.Items[0].chatId?.S || result.Items[0].chatId;
        res.json({ chatId });
      } else {
        res.status(404).json({ error: 'Không tìm thấy cuộc trò chuyện tương ứng' });
      }
    } catch (error) {
      console.error('Lỗi khi lấy chatId từ chatRoomId:', error);
      res.status(500).json({ error: 'Internal server error' });
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
      const avatar = 'https://lab2s3aduong.s3.ap-southeast-1.amazonaws.com/icon-vchat.png';

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
        status: "ACTIVE"
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

      // Lưu conversation vào DynamoDB
      await dynamoDB.put({
        TableName: "Conversations",
        Item: conversationData,
      }).promise();

      // Thông báo qua Redis và Socket.IO
      const notificationMessage = {
        type: "GROUP_CREATED",
        groupName: nameGroup,
        avatar,
        chatRoomId,
        participants,
        createdBy,
      };

      // Phát thông báo đến tất cả thành viên trong nhóm chat qua Redis và Socket.IO
      participants.forEach((phoneNumber) => {
        if (phoneNumber && typeof phoneNumber === 'string' && phoneNumber.trim()) {
          // Đảm bảo rằng mỗi người dùng đã join phòng chat của mình
          io.to(phoneNumber).emit("newChatRoom", notificationMessage);
          console.log(`Notification sent to ${phoneNumber}`);
        } else {
          console.error(`Invalid phone number: ${phoneNumber}`);
        }
      });

      // Trả về thông báo thành công
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

  //update thanh vien + nameGroup
  router.put("/updateChatRoom/:id", async (req, res) => {
    const { nameGroup, participants } = req.body;
    const roomId = req.params.id;

    if (!nameGroup || typeof nameGroup !== "string") {
      return res.status(400).json({ message: "Tên nhóm không hợp lệ." });
    }

    if (!Array.isArray(participants) || participants.length < 3) {
      return res.status(400).json({ message: "Danh sách thành viên phải là mảng và có ít nhất 3 thành viên." });
    }

    if (participants.some(p => typeof p !== 'string')) {
      return res.status(400).json({ message: "Danh sách thành viên phải chứa chuỗi hợp lệ." });
    }

    try {
      const updateChatRoomParams = {
        TableName: CHATROOM_TABLE,
        Key: { chatRoomId: roomId },
        UpdateExpression: "set nameGroup = :nameGroup, participants = :newMembers",
        ExpressionAttributeValues: {
          ":nameGroup": nameGroup,
          ":newMembers": participants,
        },
        ReturnValues: "ALL_NEW",
      };

      const chatRoomUpdateResult = await dynamoDB.update(updateChatRoomParams).promise();

      const scanParams = {
        TableName: "Conversations",
        FilterExpression: "chatRoomId = :roomId",
        ExpressionAttributeValues: {
          ":roomId": roomId,
        },
      };

      const scanResult = await dynamoDB.scan(scanParams).promise();

      if (scanResult.Items.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện tương ứng trong Conversations." });
      }

      const chatId = scanResult.Items[0].chatId;

      const updateConvParams = {
        TableName: "Conversations",
        Key: { chatId },
        UpdateExpression: "set fullName = :fullName, participants = :participants",
        ExpressionAttributeValues: {
          ":fullName": nameGroup,
          ":participants": participants,
        },
      };

      await dynamoDB.update(updateConvParams).promise();

      res.json(chatRoomUpdateResult.Attributes);
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      res.status(500).json({ message: "Lỗi server khi cập nhật nhóm." });
    }
  });

  // Giải tán nhóm (chuyển status thành DISBANDED)
  router.put("/disbandGroup/:id", async (req, res) => {
    const roomId = req.params.id;
    console.log("roomId ", roomId);

    try {
      const updateParams = {
        TableName: CHATROOM_TABLE,
        Key: { chatRoomId: roomId },
        UpdateExpression: "set #status = :status",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": "DISBANDED",
        },
        ReturnValues: "UPDATED_NEW",
      };

      await dynamoDB.update(updateParams).promise();

      res.json({ message: "Nhóm đã được giải tán." });
    } catch (error) {
      console.error("Lỗi giải tán nhóm:", error);
      res.status(500).json({ message: "Lỗi server khi giải tán nhóm." });
    }
  });

  // Xóa thành viên khỏi nhóm
  router.put("/removeMember", async (req, res) => {
    const { chatRoomId, phoneNumber } = req.body;

    if (!chatRoomId || !phoneNumber) {
      return res.status(400).json({ message: "Thiếu chatRoomId hoặc phoneNumber." });
    }

    try {
      // Lấy thông tin phòng chat
      const getParams = {
        TableName: CHATROOM_TABLE,
        Key: { chatRoomId },
      };

      const result = await dynamoDB.get(getParams).promise();

      if (!result.Item) {
        return res.status(404).json({ message: "Không tìm thấy phòng chat." });
      }

      const chatRoom = result.Item;
      const updatedParticipants = chatRoom.participants.filter(p => p !== phoneNumber);


      // Cập nhật lại danh sách thành viên
      const updateParams = {
        TableName: CHATROOM_TABLE,
        Key: { chatRoomId },
        UpdateExpression: "set participants = :participants",
        ExpressionAttributeValues: {
          ":participants": updatedParticipants,
        },
        ReturnValues: "ALL_NEW",
      };

      const updateResult = await dynamoDB.update(updateParams).promise();

      // Đồng bộ với Conversations nếu tồn tại
      const scanParams = {
        TableName: "Conversations",
        FilterExpression: "chatRoomId = :chatRoomId",
        ExpressionAttributeValues: {
          ":chatRoomId": chatRoomId,
        },
      };

      const convScanResult = await dynamoDB.scan(scanParams).promise();

      if (convScanResult.Items.length > 0) {
        const conversation = convScanResult.Items[0];

        const updateConvParams = {
          TableName: "Conversations",
          Key: { chatId: conversation.chatId },
          UpdateExpression: "set participants = :participants",
          ExpressionAttributeValues: {
            ":participants": updatedParticipants,
          },
        };

        await dynamoDB.update(updateConvParams).promise();
      }

      res.json({
        message: "Đã xóa thành viên khỏi nhóm thành công!",
        updatedParticipants,
      });
    } catch (error) {
      console.error("Lỗi khi xóa thành viên khỏi nhóm:", error);
      res.status(500).json({ message: "Lỗi server!" });
    }
  });

  return router;
};


// module.exports = router;
