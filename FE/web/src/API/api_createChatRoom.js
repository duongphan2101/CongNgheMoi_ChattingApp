const createChatRoom = async (chatRoomData) => {
    try {
      const response = await fetch("http://localhost:3618/createChatRoom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatRoomData),
      });
  
      if (!response.ok) {
        throw new Error("Tạo ChatRoom thất bại!");
      }
  
      const data = await response.json();
      return data; // Trả về dữ liệu từ API
    } catch (error) {
      console.error("Lỗi trong API createChatRoom:", error);
      return null; // Trả về null nếu có lỗi
    }
  };
  
  export default createChatRoom;