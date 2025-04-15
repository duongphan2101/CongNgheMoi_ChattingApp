import getIp from "../utils/getIp_notPORT.js";
const fetchChatRoom = async (chatRoomId) => {
    try {
         const BASE_URL = getIp();
        if (!BASE_URL) throw new Error("Không thể xác định BASE_URL");
        if (!chatRoomId) {
            throw new Error("Thiếu chatRoomId");
        }

        const response = await fetch(`http://${BASE_URL}:3618/chatRoom?chatRoomId=${chatRoomId}`);
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
