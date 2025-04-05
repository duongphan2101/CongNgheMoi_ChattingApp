const sendConfirmationEmail = async (email, phoneNumber, password, fullName) => {
    try {
      const response = await fetch("http://192.168.1.143:3721/auth/send-confirmation-email", {
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