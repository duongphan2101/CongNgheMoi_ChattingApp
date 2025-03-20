const fetchMessagesByChatRoomId = async (chatRoomId) => {
    try {
        if (!chatRoomId) {
            throw new Error("Thiếu chatRoomId");
        }

        const response = await fetch(`http://localhost:3618/messages?chatRoomId=${chatRoomId}`);
        if (!response.ok) {
            throw new Error("Không thể lấy tin nhắn");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Lỗi khi lấy tin nhắn:", error);
        return [];
    }
};

export default fetchMessagesByChatRoomId;
