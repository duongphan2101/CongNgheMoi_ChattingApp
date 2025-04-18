const updateChatRoom = async ({ roomId, nameGroup, participants }) => {
  try {
    // Gửi yêu cầu PUT để cập nhật tên nhóm và danh sách thành viên
    const res = await fetch(`http://localhost:3618/updateChatRoom/${roomId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nameGroup,
        participants
      })
    });

    // Đọc dữ liệu trả về từ API
    const data = await res.json();

    // Nếu yêu cầu không thành công, ném lỗi
    if (!res.ok) {
      throw new Error(data.message || "Cập nhật nhóm thất bại!");
    }

    // Trả về kết quả thành công
    return data;
  } catch (err) {
    // Ném lỗi để có thể xử lý ở nơi gọi hàm
    throw err;
  }
};

export default updateChatRoom;

