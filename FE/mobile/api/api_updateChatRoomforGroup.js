import getIp from "../utils/getIp_notPORT";
const updateChatRoom = async ({ roomId, nameGroup, participants, phone }) => {
  try {
    const BASE_URL = getIp();
    if (!BASE_URL) throw new Error("Không thể xác định BASE_URL");
    const res = await fetch(`http://${BASE_URL}:3618/updateChatRoom/${roomId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nameGroup,
        participants,
        phone
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
