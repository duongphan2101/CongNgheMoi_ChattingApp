import getIp from "../../utils/getIp.js";

const sendResetLink = async (phoneNumber) => {
  try {
    const BASE_URL = getIp();

    if (!BASE_URL) throw new Error("Không thể xác định BASE_URL");

    const response = await fetch(`${BASE_URL}/auth/send-reset-link-on-phone`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumber }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Gửi link reset thất bại!");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Lỗi gửi link reset:", error?.message ?? error);
    return null;
  }
};

export default sendResetLink;