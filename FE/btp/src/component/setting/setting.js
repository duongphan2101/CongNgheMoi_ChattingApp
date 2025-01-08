import React, { useState } from 'react';
import './setting_style.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function Setting({setCurrentView }) {
const [notifications, setNotifications] = useState(false);
const [language, setLanguage] = useState('Tiếng Việt');
const [mode, setMode] = useState('Mặc định');
const toggleNotifications = () => {
setNotifications(!notifications);
};
return (
<div className="container chat-container border">
{/* Intro Animation /}
{/ <div className="intro-animation">
<p>Welcome!</p>
<p style={{ fontSize: '34px', fontWeight: 'bold' }}>VChat</p>
</div> */}

  {/* Sidebar */}
  <div className="sidebar">
    <div className="sidebar-header">
      <div className="sidebar-header_search">
        <input type="text" placeholder="Search..." />
        <button className="btn"><i className="bi bi-search text-light"></i></button>
      </div>
    </div>

    {/* User List */}
    <div className="user-list">
      <div className="user active">
        <img className="user-avt" src="./imgs/9306614.jpg" alt="User" />
        <div>
          <strong>Khalid</strong><br />
          <small>Khalid is online</small>
        </div>
      </div>

      <div className="user">
        <img className="user-avt" src="./imgs/9334176.jpg" alt="User" />
        <div>
          <strong>Taherah Big</strong><br />
          <small>Last seen 7 mins ago</small>
        </div>
      </div>

      <div className="user">
        <img className="user-avt" src="./imgs/1.jpg" alt="User" />
        <div>
          <strong>Sami Rafi</strong><br />
          <small>Sami is online</small>
        </div>
      </div>
    </div>

    <div className="sidebar-bottom d-flex justify-content-around align-items-center">
      <button className="sidebar-bottom-btn btn"><i className="sidebar-bottom_icon bi bi-person-circle text-light"></i></button>
      <button className="sidebar-bottom-btn btn " onClick={() => setCurrentView('chat')}><i className="sidebar-bottom_icon bi bi-chat-dots text-light"></i></button>
      <button className="sidebar-bottom-btn btn"><i className="sidebar-bottom_icon bi bi-person-rolodex text-light"></i></button>
      <button className="sidebar-bottom-btn btn"><i className="sidebar-bottom_icon bi bi-cloud text-light"></i></button>
      <button className="sidebar-bottom-btn btn active"><i className="sidebar-bottom_icon bi bi-gear text-light"></i></button>
    </div>
  </div>

  {/* Chat Box */}
  <div className="chat-box">
            <div className="chat-header">
                <p className="chat-header_name">Setting</p>
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
                        value={mode} 
                        onChange={(e) => setMode(e.target.value)}
                    >
                        <option value="Mặc định">Mặc định</option>
                        <option value="Dark Mode">Dark Mode</option>
                        <option value="Light Mode">Light Mode</option>
                    </select>
                </div>
            </div>
        </div>
</div>
);
}

export default Setting;