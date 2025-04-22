const removeMemberFromGroup = async (chatRoomId, phoneNumber) => {
  try {
    const response = await fetch("http://localhost:3618/removeMember", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chatRoomId, phoneNumber }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Có lỗi xảy ra khi xóa thành viên.");
    }
    return data;
  } catch (error) {
    console.error("Lỗi khi gọi API xóa thành viên:", error);
    throw error;
  }
};
export default removeMemberFromGroup;