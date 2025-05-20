const Message = require("../models/message");
const AWS = require("aws-sdk");

const createSystemMessage = async (chatRoomId, participants, messageContent, systemAction) => {
    const message = new Message(
        chatRoomId,
        null, // sender là null cho tin nhắn hệ thống
        participants,
        messageContent,
        "system",
        [],
        systemAction
    );
    console.log("MESSAGE: ",message);

    const dynamoDB = new AWS.DynamoDB.DocumentClient();

    await dynamoDB.put({
        TableName: "Message",
        Item: message,
    }).promise();

    // Cập nhật lastMessage trong Conversations
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
        const updateParams = {
            TableName: "Conversations",
            Key: { chatId: conversation.chatId },
            UpdateExpression: "SET lastMessage = :lastMessage, lastMessageAt = :lastMessageAt",
            ExpressionAttributeValues: {
                ":lastMessage": messageContent,
                ":lastMessageAt": new Date(message.timestamp).toLocaleString("vi-VN", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                }),
            },
        };
        await dynamoDB.update(updateParams).promise();
    }

    return message;
};

module.exports = { createSystemMessage };