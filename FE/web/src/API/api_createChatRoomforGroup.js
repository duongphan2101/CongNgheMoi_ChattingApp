const createGroupChatRoom = async ({ nameGroup, createdBy, participants }) => {
  try {
    
      const admin = createdBy;

    const res = await fetch("http://localhost:3618/createChatRoomForGroup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nameGroup,
        createdBy,
        participants,
        admin
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Tạo nhóm thất bại!");
    }

    return data;
  } catch (err) {
    throw err;
  }
};

export default createGroupChatRoom;
