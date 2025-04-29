const outGroup = async (chatRoomId, phoneNumber ) => {
  try {
    const response = await fetch("http://localhost:3618/outGroup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chatRoomId, phoneNumber }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Lỗi khi rời nhóm.");
    }

    return data;
  } catch (error) {
    console.error("Lỗi outGroup:", error);
    throw error;
  }
};

export default outGroup;
