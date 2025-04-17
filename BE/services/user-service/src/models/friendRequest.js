class FriendRequest {
    constructor(senderPhone, receiverPhone) {
      this.senderPhone = senderPhone;
      this.receiverPhone = receiverPhone;
      this.requestId = `R${Math.floor(Math.random() * 100)}`; // Tùy cách bạn generate ID
      this.createdAt = new Date().toISOString();
      this.status = 'pending';
    }
}

module.exports = FriendRequest;