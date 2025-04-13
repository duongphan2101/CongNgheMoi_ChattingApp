import getIp from "../utils/getIp";

const sendConfirmationEmail = async (email, phoneNumber, password, fullName) => {
  try {
    const BASE_URL = getIp();
    if (!BASE_URL) throw new Error("Không thể xác định địa chỉ IP của máy chủ.");
    
    const response = await fetch(`${BASE_URL}/auth/send-confirmation-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, phoneNumber, password, fullName }),
    });

    return await response.json();
  } catch (error) {
    console.error("Lỗi khi gửi email xác nhận:", error);
    return { success: false, message: "Lỗi server. Vui lòng thử lại sau." };
  }
};

export default sendConfirmationEmail;
