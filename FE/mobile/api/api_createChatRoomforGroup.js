import getIp from "../utils/getIp_notPORT";
const createGroupChatRoom = async ({ nameGroup, createdBy, participants }) => {
  try {
    const BASE_URL = getIp();
    if (!BASE_URL) throw new Error("Không thể xác định BASE_URL");
    const admin = createdBy;
    console.log("BASE URL ",BASE_URL)
    const res = await fetch(`http://${BASE_URL}:3618/createChatRoomForGroup`, {
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
