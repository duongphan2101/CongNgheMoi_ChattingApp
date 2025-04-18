const fetchChatRoom = async (chatRoomId) => {
    try {
        if (!chatRoomId) {
            throw new Error("Thiếu chatRoomId");
        }

        const response = await fetch(`http://localhost:3618/chatRoom?chatRoomId=${chatRoomId}`);
        if (!response.ok) {
            throw new Error("Không tìm thấy phòng chat");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin phòng chat:", error);
        return null;
    }
};

export default fetchChatRoom;
