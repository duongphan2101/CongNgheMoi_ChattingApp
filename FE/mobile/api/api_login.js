import AsyncStorage from "@react-native-async-storage/async-storage";
import getIp from "../utils/getIp.js";

const login = async (phoneNumber, password) => {
  try {
    const BASE_URL = getIp();

    if (!BASE_URL) throw new Error("Không thể xác định BASE_URL");

    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumber, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Đăng nhập thất bại!");
    }

    const data = await response.json();

    if (data.token) {
      await AsyncStorage.setItem("accessToken", data.token);
    }

    return data;
  } catch (error) {
    console.error("Lỗi đăng nhập:", error.message || error);
    return null;
  }
};


export default login;

