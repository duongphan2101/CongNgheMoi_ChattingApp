import getIp from "../utils/getIp_notPORT";

const getChatIdFromRoom = async (chatRoomId) => {
  try {
     const BASE_URL = getIp();
        if (!BASE_URL) throw new Error("Không thể xác định BASE_URL");
    const response = await fetch(`http://${BASE_URL}:3618/getChatIdFromRoom?chatRoomId=${chatRoomId}`);

    if (!response.ok) {
      throw new Error(`Lỗi khi gọi API: ${response.status}`);
    }

    const data = await response.json();
    return data.chatId;
  } catch (error) {
    console.error("Lỗi khi lấy chatId từ chatRoomId:", error);
    return null;
  }
};
export default getChatIdFromRoom;