import React, { useState } from "react";
import "./setting_style.css";
import "bootstrap/dist/css/bootstrap.min.css";

function Setting({ setIsLoggedIn, setCurrentView }) {
  const [notifications, setNotifications] = useState(false);
  const [language, setLanguage] = useState("Tiếng Việt");
  const [mode, setMode] = useState("Mặc định");

  console.log("🔹 Setting.js - setIsLoggedIn:", setIsLoggedIn);
  console.log("🔹 Setting.js - setCurrentView:", setCurrentView);

  const toggleNotifications = () => {
    setNotifications(!notifications);
  };

  const handleLogout = () => {
    if (!setIsLoggedIn) {
      console.error("setIsLoggedIn is undefined!");
      return;
    }
    setIsLoggedIn(false); // Quay về màn hình Login
    setCurrentView("login"); // Điều hướng về login
  };

  return (
    <div className="chat-box container">
      <div className="chat-header row">
        <div className="col-sm-2 d-flex align-items-center">
          <i className="sidebar-bottom_icon bi bi-gear text-light"></i>
          <p className="chat-header_name px-2 m-0">Setting</p>
        </div>
      </div>
      <div className="settings">
        <div className="setting-item">
          <label>Tắt thông báo</label>
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
          <label>Ngôn Ngữ</label>
          <select
            className="mode-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="Tiếng Việt">Tiếng Việt</option>
            <option value="English">English</option>
          </select>
        </div>
        <div className="setting-item">
          <label>Chế độ</label>
          <select
            className="mode-select"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="Mặc định">Mặc định</option>
            <option value="Dark Mode">Dark Mode</option>
            <option value="Light Mode">Light Mode</option>
          </select>
        </div>
        <button className="setting-item btn" onClick={handleLogout}>
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

export default Setting;
