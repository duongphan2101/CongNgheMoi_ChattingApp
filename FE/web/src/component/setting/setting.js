import React, { useState } from "react";
import "./setting_style.css";
import "bootstrap/dist/css/bootstrap.min.css";

function Setting({ setIsLoggedIn, setCurrentView }) {
  const [notifications, setNotifications] = useState(false);
  const [language, setLanguage] = useState("Tiếng Việt");
  const [mode, setMode] = useState("Mặc định");
  const [showModal, setShowModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");


  const toggleNotifications = () => {
    setNotifications(!notifications);
  };

  const handleLogout = () => {
    if (!setIsLoggedIn) {
      return;
    }
    setIsLoggedIn(false); // Quay về màn hình Login
    setCurrentView("login"); // Điều hướng về login
  };

  const handleChangePassword = () => { 
    setShowModal(true); 
};

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Old Password:", oldPassword);
    console.log("New Password:", newPassword);
    console.log("Confirm Password:", confirmPassword);  
    setShowModal(false);
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
            <option value="Vietnamese">Tiếng Việt</option>
            <option value="English">Tiếng Anh</option>
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
       <button className="setting-item btn" onClick={handleChangePassword}>
          Đổi Mật Khẩu
        </button>
        <button className="setting-item btn" onClick={handleLogout}>
          Đăng xuất
        </button>
      </div>
      {showModal && (
        <div className="modal" style={{ display: "block" }}>
          <div className="modal-content">
            <span className="close" onClick={() => setShowModal(false)}>&times;</span>
            <h2>Đổi Mật Khẩu</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Mật khẩu cũ</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Xác nhận mật khẩu</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn1">Xác Nhận</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Setting;
