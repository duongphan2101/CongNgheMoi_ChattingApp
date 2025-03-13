const changePassword = async (phoneNumber, newPassword) => {
  try {
    console.log("Sending phoneNumber:", phoneNumber); // Debug

    const response = await fetch("http://localhost:3721/auth/reset-password", { // Updated endpoint
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumber, newPassword }), // Updated body parameter
    });

    // Check if the response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Đổi mật khẩu thất bại: Server không trả về JSON");
    }

    const data = await response.json();
    console.log("Response data:", data);

    if (!response.ok) {
      throw new Error(data.message || "Đổi mật khẩu thất bại");
    }

    return true; // Trả về true nếu thành công
  } catch (error) {
    console.error("Lỗi khi gọi API changePassword:", error);
    throw error; // Ném lỗi để frontend xử lý
  }
};

export default changePassword;