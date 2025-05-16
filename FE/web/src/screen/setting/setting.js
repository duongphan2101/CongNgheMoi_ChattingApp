import React, { useState, useContext } from "react";
import "./setting_style.css";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeContext } from "../../contexts/ThemeContext";
import changePasswordSetting from "../../API/api_changePassSetting";
import { LanguageContext, locales } from "../../contexts/LanguageContext";


function Setting({ setIsLoggedIn, setCurrentView }) {
  const [notifications, setNotifications] = useState(false);

  const [mode, setMode] = useState("Mặc định");
  const [showModal, setShowModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { setTheme } = useContext(ThemeContext);

  const { language, setLanguage } = useContext(LanguageContext);
  const t = locales[language];
  const toggleNotifications = () => {
    setNotifications(!notifications);
  };

  const handleLogout = () => {
    if (!setIsLoggedIn) {
      return;
    }
    setIsLoggedIn(false);
    setCurrentView("login");
    localStorage.removeItem("accessToken");
  };

  const handleChangePassword = () => {
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!", { position: "top-right" });
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Bạn cần đăng nhập để thay đổi mật khẩu!", { position: "top-right" });
      return;
    }

    try {
      await changePasswordSetting(oldPassword, newPassword, confirmPassword, token);
      toast.success("Đổi mật khẩu thành công!", { position: "top-right" });
      setShowModal(false);
    } catch (error) {
      toast.error("Lỗi: " + error.message, { position: "top-right" });
    }
  };

  return (
    <div className="chat-box container">
      <div className="chat-header row">
        <div className="col-12 d-flex align-items-center">
          <i className="sidebar-bottom_icon bi bi-gear text-light"></i>
          <p className="chat-header_name px-2 m-0">{t.setting}</p>
        </div>
      </div>
      <div className="settings">
        <div className="setting-item">
          <label>{t.notifications}</label>
          <label className="switch">
            <input
              type="checkbox"
              checked={notifications}
              onChange={toggleNotifications}
            />
            <span className="slider round"></span>
          </label>
        </div>
        <div className="setting-item">
          <label>{t.language}</label>
          <select
            className="mode-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="vi">{t.vi}</option>
            <option value="en">{t.en}</option>
          </select>
        </div>
        <div className="setting-item">
          <label>{t.mode}</label>
          <select
            className="mode-select"
            value={mode}
            onChange={(e) => {
              const selectedMode = e.target.value;
              setMode(selectedMode);
              if (selectedMode === "Dark Mode") {
                setTheme("dark");
              } else if (selectedMode === "Light Mode") {
                setTheme("light");
              }
            }}
          >
            <option value="Dark Mode">{t.dark}</option>
            <option value="Light Mode">{t.light}</option>
          </select>
        </div>

        <button className="setting-item btn" onClick={handleChangePassword}>
          {t.changePassword}
        </button>
        <button className="setting-item btn" onClick={handleLogout}>
          {t.logout}
        </button>
      </div>
      {showModal && (
        <div className="modal" style={{ display: "block" }}>
          <div className="modal-content">
            <button
              type="button"
              className="btn-close"
              onClick={() => setShowModal(false)}
            ></button>
            <h2 className="h2">{t.resetPassword}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{t.oldPassword}</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.newPassword}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.replatePassword}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn1">{t.save}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Setting;
