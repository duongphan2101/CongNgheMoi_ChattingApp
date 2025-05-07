const getChatIdFromRoom = async (chatRoomId) => {
  try {
    const response = await fetch(`http://localhost:3618/getChatIdFromRoom?chatRoomId=${chatRoomId}`);

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