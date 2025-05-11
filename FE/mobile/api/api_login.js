import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";
import getIp from "../utils/getIp.js";
const login = async (phoneNumber, password) => {
  try {
    const BASE_URL = getIp("auth");
    if (!BASE_URL) throw new Error("Không thể xác định BASE_URL");

    // Gửi yêu cầu đăng nhập để lấy token
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
      // Lưu token vào AsyncStorage
      await AsyncStorage.setItem("accessToken", data.token);

      // Kết nối với Socket.IO và gửi token lên server
      const socket = io(`${BASE_URL}/chat`, {
        transports: ["websocket"],
        auth: {
          token: data.token,
        },
      });

      socket.on("connect", () => {
        console.log("Kết nối thành công với Socket.IO");
      });

      socket.on("disconnect", () => {
        console.log("Mất kết nối với Socket.IO");
      });

      return data;  // Trả về dữ liệu đăng nhập (có token)
    }

    return null;  // Trường hợp không có token
  } catch (error) {
    console.error("Lỗi đăng nhập:", error.message || error);
    return null;
  }
};

export default login;


