import getIp from "../utils/getIp_notPORT.js";

const deleteMessage = async (chatRoomId, messageId) => {
    try {
        const BASE_URL = getIp();
        if (!BASE_URL) throw new Error("Không thể xác định BASE_URL");
        if (!chatRoomId || !messageId) {
            throw new Error("Thiếu chatRoomId hoặc messageId");
        }

        const response = await fetch(`http://${BASE_URL}:3618/deleteMessage`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chatRoomId,
                messageId
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Không thể thu hồi tin nhắn");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Lỗi khi thu hồi tin nhắn:", error);
        throw error;
    }
};

export default deleteMessage;