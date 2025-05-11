import getIp from "../utils/getIp_notPORT";
const setAdmin = async (chatRoomId, phoneNumber) => {
    try {
        const BASE_URL = getIp();
        if (!BASE_URL) throw new Error("Không thể xác định BASE_URL");
        const response = await fetch(`http://${BASE_URL}:3618/setAdmin`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ chatRoomId, phoneNumber }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Lỗi khi set admin.");
        }

        return data;
    } catch (error) {
        console.error("Lỗi setAdmin:", error);
        throw error;
    }
};

export default setAdmin;
