import React, { createContext, useState } from "react";
import login from "../API/api_login";

export const LanguageContext = createContext();

export const locales = {
  vi: {
    setting: "Cài Đặt",
    logout: "Đăng Xuất",
    changePassword: "Đổi Mật Khẩu",
    notifications: "Tắt thông báo",
    language: "Ngôn Ngữ",
    mode: "Chế Độ",
    contacts: "Danh Bạ",
    search: "Tìm Kiếm",
    friendRequest: "Lời mời kết bạn",
    noFriendRequest: "Không có lời mời kết bạn nào.",
    friendList: "Danh sách bạn bè",
    login: "Đăng Nhập",
    register: "Đăng Ký",
    forgotPassword: "Quên Mật Khẩu",
    sendResetLink: "Gửi liên kết đặt lại mật khẩu",
    confirmEmail: "Xác Nhận Email",
    resetPassword: "Đặt Lại Mật Khẩu",
    PhoneNumber: "Số Điện Thoại",
    Password: "Mật Khẩu",
    confirmPassword: "Xác Nhận Mật Khẩu",
    oldPassword: "Mật Khẩu Cũ",
    newPassword: "Mật Khẩu Mới",
    notAccount: "Bạn chưa có tài khoản?",
    haveAccount: "Bạn đã có tài khoản?",
    email: "Email",
    userName: "Tên Người Dùng",
    loadingRegister: "Đang Đăng Ký...",
    forgotPasswordSuccess: "Đặt lại mật khẩu thành công. Vui lòng kiểm tra email của bạn.",
    forgotPasswordError: "Đặt lại mật khẩu thất bại. Vui lòng thử lại.",
    linkSetPass: "Gửi link đặt lại mật khẩu",
    linkSetPassSuccess: "Gửi link đặt lại mật khẩu thành công.",
    linkSetPassError: "Gửi link đặt lại mật khẩu thất bại. Vui lòng thử lại.",
    linkSetPassEmail: "Vui lòng kiểm tra email của bạn để nhận liên kết đặt lại mật khẩu.",
    linkSetPassErrorEmail: "Gửi link đặt lại mật khẩu thất bại. Vui lòng kiểm tra email của bạn.",
    linkding: "Đang tải...",
  },
  en: {
    setting: "Settings",
    logout: "Logout",
    changePassword: "Change Password",
    notifications: "Notifications",
    language: "Language",
    mode: "Mode",
    contacts: "Contacts",
    search: "Search",
    friendRequest: "Friend Requests",
    noFriendRequest: "No friend requests.",
    friendList: "Friend List",
    login: "Login",
    register: "Register",
    forgotPassword: "Forgot Password",
    sendResetLink: "Send Reset Link",
    confirmEmail: "Confirm Email",
    resetPassword: "Reset Password",
    PhoneNumber: "Phone Number",
    Password: "Password",
    confirmPassword: "Confirm Password",
    oldPassword: "Old Password",
    newPassword: "New Password",
    notAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    email: "Email",
    userName: "Username",
    loadingRegister: "Registering...",
    forgotPasswordSuccess: "Password reset successful. Please check your email.",
    forgotPasswordError: "Password reset failed. Please try again.",
    linkSetPass: "Send password reset link",
    linkSetPassSuccess: "Password reset link sent successfully.",
    linkSetPassError: "Failed to send password reset link. Please try again.",
    linkSetPassEmail: "Please check your email for the password reset link.",
    linkSetPassErrorEmail: "Failed to send password reset link. Please check your email.",
    linkding: "Loading...",
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("vi");

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

