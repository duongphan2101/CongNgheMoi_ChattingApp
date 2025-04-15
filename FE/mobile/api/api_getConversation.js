import AsyncStorage from '@react-native-async-storage/async-storage';
import getIp from "../utils/getIp_notPORT.js";

const getConversations = async () => {
    try {
        const token = await AsyncStorage.getItem("accessToken");

        if (!token) {
            console.error("Không tìm thấy token!");
            return null;
        }

        const BASE_URL = getIp();
        if (!BASE_URL) throw new Error("Không thể xác định BASE_URL");

        const response = await fetch(`http://${BASE_URL}:3618/conversations`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Lỗi khi lấy danh sách cuộc trò chuyện!");
        }
        return data;
    } catch (error) {
        console.error("Lỗi:", error.message);
        return null;
    }
};

export default getConversations;
