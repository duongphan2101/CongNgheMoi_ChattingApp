const updateChatRoom = async ({ roomId, nameGroup, participants }) => {
  try {
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

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Cập nhật nhóm thất bại!");
    }

    return data;
  } catch (err) {
    throw err;
  }
};

export default updateChatRoom;
