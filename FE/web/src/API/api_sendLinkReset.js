const sendLinkReset = async (phoneNumber) => {
    try {
      console.log("Sending phoneNumber:", phoneNumber); // Debug
  
      const response = await fetch("http://localhost:3721/auth/send-reset-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber }),
      });
  
      // Check if the response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Gửi link đặt lại mật khẩu thất bại: Server không trả về JSON");
      }
  
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Gửi link đặt lại mật khẩu thất bại");
      }
  
      return data; // Return the response data if successful
    } catch (error) {
      console.error("Lỗi khi gọi API sendLinkReset:", error);
      throw error; // Throw error to be handled by the caller
    }
  };
  
  export default sendLinkReset;