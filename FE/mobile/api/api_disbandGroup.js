import getIp from "../utils/getIp_notPORT";
const disbandGroup = async (chatRoomId) => {
  const BASE_URL = getIp();
  if (!BASE_URL) throw new Error("Không thể xác định BASE_URL");
  const response = await fetch(`http://${BASE_URL}:3618/disbandGroup/${chatRoomId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const responseText = await response.text();
  console.log("Raw response:", responseText);

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (err) {
    throw new Error("Phản hồi từ server không phải JSON hợp lệ.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Lỗi khi giải tán nhóm.");
  }

  return data;
};

export default disbandGroup;
