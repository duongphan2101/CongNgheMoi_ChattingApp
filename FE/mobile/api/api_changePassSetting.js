import AsyncStorage from "@react-native-async-storage/async-storage";
import getIp from "../utils/getIp";

const changePassword = async (currentPassword, newPassword, confirmPassword) => {
  try {
    const BASE_URL = getIp("user");
    const token = await AsyncStorage.getItem("accessToken");

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new Error("Vui lòng nhập đầy đủ thông tin!");
    }

    if (newPassword !== confirmPassword) {
      throw new Error("Mật khẩu xác nhận không khớp.");
    }

    const response = await fetch(`${BASE_URL}/user/change-passwordSetting`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        oldPassword: currentPassword,
        newPassword,
        confirmPassword, 
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Đổi mật khẩu thất bại!");
    }

    return data;
  } catch (error) {
    console.error("Lỗi đổi mật khẩu:", error.message || error);
    throw error;
  }
};

export default changePassword;
