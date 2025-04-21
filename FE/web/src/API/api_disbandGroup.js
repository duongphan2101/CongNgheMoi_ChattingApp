const disbandGroup = async (chatRoomId) => {
  const response = await fetch(`http://localhost:3618/disbandGroup/${chatRoomId}`, {
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
