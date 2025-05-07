import getIp from "../utils/getIp_notPORT.js";
const fetchChatRoom = async (chatRoomId) => {
  try {
    const BASE_URL = getIp();
    const response = await fetch(`http://${BASE_URL}:3618/chatRoom?chatRoomId=${chatRoomId}`);
    
    if (!response.ok) {
      console.error("Không nhận được response OK từ server. Status:", response.status);
      throw new Error("Không tìm thấy phòng chat");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Lỗi khi gọi fetchChatRoom:", error);
    return null;
  }
};
export default fetchChatRoom;
