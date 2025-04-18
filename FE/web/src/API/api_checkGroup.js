const checkGroup = async (chatRoomId) => {
  try {
    // Gửi yêu cầu GET để lấy thông tin của nhóm chat
    const res = await fetch(`http://localhost:3618/getChatRoom/${chatRoomId}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Không thể lấy thông tin nhóm.");
    }

    // Trả về thông tin nhóm hoặc thực hiện hành động sau khi kiểm tra thành công
    console.log("Thông tin nhóm:", data);
    return data;
  } catch (err) {
    console.error("Lỗi khi kiểm tra nhóm:", err);
    throw err;
  }
};
export default checkGroup;