const express = require("express");
const AWS = require("aws-sdk");
const verifyToken = require("../middlewares/authMiddleware");

const router = express.Router();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "Conversattions";
const CHATROOM_TABLE = "ChatRooms";
const MESSAGE_TABLE = "Message";

router.get("/conversations", verifyToken, async (req, res) => {
    try {
        const phoneNumber = req.user.phoneNumber;

        const params = {
            TableName: TABLE_NAME,
            FilterExpression: "contains(participants, :phoneNumber)",
            ExpressionAttributeValues: { ":phoneNumber": phoneNumber }
        };

        const result = await dynamoDB.scan(params).promise();

        if (!result.Items || result.Items.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện nào!" });
        }

        res.json(result.Items);
    } catch (error) {
        console.error("Lỗi lấy danh sách conversations:", error);
        res.status(500).json({ message: "Lỗi server!" });
    }
});



router.get("/checkChatRoom", async (req, res) => {
    try {
        const { myPhone, userPhone } = req.query;
        if (!myPhone || !userPhone) {
            return res.status(400).json({ message: "Thiếu thông tin số điện thoại!" });
        }

        await updateParticipantsDataType();
        const params = {
            TableName: TABLE_NAME,
            FilterExpression: "contains(participants, :myPhone) AND contains(participants, :userPhone)",
            ExpressionAttributeValues: {
                ":myPhone": myPhone,
                ":userPhone": userPhone
            }
        };

        const result = await dynamoDB.scan(params).promise();
        if (result.Items.length > 0) {
            return res.json({ chatRoomId: result.Items[0].chatRoomId }); 
        } else {
            return res.json({ chatRoomId: null });
        }
    } catch (error) {
        console.error("Lỗi kiểm tra phòng chat:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
});

const updateParticipantsDataType = async () => {
    try {
        const scanParams = { TableName: TABLE_NAME };
        const data = await dynamoDB.scan(scanParams).promise();

        for (let item of data.Items) {
            if (Array.isArray(item.participants) && item.participants[0].S) {
                // 🔹 Chuyển từ [{S: "0975707511"}, {S: "0939409801"}] → ["0975707511", "0939409801"]
                const newParticipants = item.participants.map(p => p.S);

                const updateParams = {
                    TableName: TABLE_NAME,
                    Key: { chatId: item.chatId },
                    UpdateExpression: "SET participants = :newParticipants",
                    ExpressionAttributeValues: {
                        ":newParticipants": newParticipants
                    }
                };

                await dynamoDB.update(updateParams).promise();
                console.log(`✅ Đã cập nhật chatId: ${item.chatId}`);
            }
        }

        // console.log("🎉 Cập nhật kiểu dữ liệu xong!");
    } catch (error) {
        console.error("❌ Lỗi khi cập nhật kiểu dữ liệu participants:", error);
    }
};

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

module.exports = router;

