const crypto = require("crypto");

class Message {
    constructor(chatRoomId, sender, receiver, message, type, isDeletedBy) {
        this.chatRoomId = chatRoomId;  // Partition Key
        this.timestamp = Date.now();   // Sort Key
        this.messageId = crypto.randomUUID();
        this.sender = sender;   
        this.receiver = receiver; 
        this.message = message;   
        this.type = type;
        this.reactions = {};
        this.isDeletedBy = isDeletedBy || [];
    }
}

module.exports = Message;