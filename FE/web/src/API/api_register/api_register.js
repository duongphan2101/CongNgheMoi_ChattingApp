const register = async (phoneNumber, password, userName) => {
  try {
      const response = await fetch("http://localhost:3721/auth/register", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ phoneNumber, password, fullName: userName }),
      });

      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
          throw new Error(data.message || "Đăng ký thất bại");
      }

      return data;
  } catch (error) {
      console.error("Lỗi khi gọi API register:", error);
      return null;
  }
};

export default register;
