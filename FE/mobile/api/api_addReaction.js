import getIp from "../utils/getIp_notPORT";

const BASE_URL = getIp();

const addReaction = async (chatRoomId, messageId, user, reaction) => {
    try {
        const response = await fetch(`http://${BASE_URL}:3618/addReaction`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            chatRoomId,
            messageId,
            user,
            reaction,
        }),
        });

        if (!response.ok) {
        throw new Error("Thêm reaction thất bại");
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Lỗi khi thêm reaction:", error);
        throw error;
    }
};

export default addReaction;