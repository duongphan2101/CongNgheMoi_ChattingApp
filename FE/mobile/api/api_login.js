import AsyncStorage from "@react-native-async-storage/async-storage";

const SERVER_IP = "192.168.1.143";
const SERVER_PORT = "3721";
const BASE_URL = `http://${SERVER_IP}:${SERVER_PORT}`;

const login = async (phoneNumber, password) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
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
      await AsyncStorage.setItem("accessToken", data.token);
    }

    return data;
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    return null;
  }
};

export default login;

