const getDataFromRoom = async (chatRoomId) => {
  try {
    const response = await fetch(`http://localhost:3618/getDataFromRoom?chatRoomId=${chatRoomId}`);

    if (!response.ok) {
      throw new Error(`Lỗi khi gọi API: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin chatRoom từ chatRoomId:", error);
    return null;
  }
};
export default getDataFromRoom;