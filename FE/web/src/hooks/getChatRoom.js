import { useEffect, useState, useCallback } from "react";
import getChatRoom from "../API/api_getChatRoombyChatRoomId";

const useFetchChatRoom = (chatRoomId) => {
  const [chatRoom, setChatRoom] = useState(null);

  const fetchChatRoom = useCallback(async () => {
    if (!chatRoomId) return; // Tránh gọi API khi không có chatRoomId

    try {
      const data = await getChatRoom(chatRoomId);
      setChatRoom(data); // Lưu dữ liệu nhận được từ API vào state
    } catch (err) {
      console.error("Failed to fetch chat room:", err);
      setChatRoom(null); // Nếu có lỗi thì set lại chatRoom thành null
    }
  }, [chatRoomId]);

  useEffect(() => {
    fetchChatRoom();
  }, [fetchChatRoom]);

  return chatRoom; // Trả về chatRoom (có thể là null hoặc object chứa dữ liệu chat room)
};

export default useFetchChatRoom;



