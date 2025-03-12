const login = async (phoneNumber, password) => {
  try {
      const response = await fetch(`http://localhost:3721/auth/login`, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ phoneNumber, password }),
      });

      const data = await response.json();

      if (!response.ok) {
          throw new Error(data.message || "Đăng nhập thất bại!");
      }

      if (data.token) {
          localStorage.setItem("accessToken", data.token);
      }

      return data;
  } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      return null;
  }
};

export default login;
