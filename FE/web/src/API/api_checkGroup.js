const checkGroup = async (chatRoomId) => {
  try {
    // Gửi yêu cầu GET với query parameter
    const res = await fetch(`http://localhost:3618/chatRoom?chatRoomId=${chatRoomId}`);

    const text = await res.text(); // lấy nội dung gốc

    // Kiểm tra mã trạng thái HTTP
    if (!res.ok) {
      throw new Error(`Lỗi ${res.status}: ${text}`);
    }

    // Parse JSON nếu có thể
    let data;
    try {
      data = JSON.parse(text);
    } catch (jsonErr) {
      throw new Error(`Không thể parse JSON: ${jsonErr.message}`);
    }

    return data;
  } catch (err) {
    console.error("Lỗi khi kiểm tra nhóm:", err);
    throw err;
  }
};

export default checkGroup;
