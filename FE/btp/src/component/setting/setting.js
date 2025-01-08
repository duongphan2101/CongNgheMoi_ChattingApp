import React, { useState } from 'react';
import './setting_style.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import a1 from '../../assets/imgs/9306614.jpg';
import a2 from '../../assets/imgs/9334176.jpg';
import a3 from '../../assets/imgs/1.jpg';

function Setting({setCurrentView }) {
const [notifications, setNotifications] = useState(false);
const [language, setLanguage] = useState('Tiếng Việt');
const [mode, setMode] = useState('Mặc định');
const toggleNotifications = () => {
setNotifications(!notifications);
};
return (
<div className="container chat-container">
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
            <img className="user-avt" src={a1} alt="User" />
            <div>
              <strong>Khalid</strong><br />
              <small>Khalid is online</small>
            </div>
          </div>

          <div className="user">
            <img className="user-avt" src={a2} alt="User" />
            <div>
              <strong>Taherah Big</strong><br />
              <small>Last seen 7 mins ago</small>
            </div>
          </div>

          <div className="user">
            <img className="user-avt" src={a3} alt="User" />
            <div>
              <strong>Sami Rafi</strong><br />
              <small>Sami is online</small>
            </div>
          </div>
        </div>

        <div className="sidebar-bottom d-flex justify-content-around align-items-center">
          <button className="sidebar-bottom-btn btn"><i className="sidebar-bottom_icon bi bi-person-circle text-light"></i></button>
          <button className="sidebar-bottom-btn btn" onClick={() => setCurrentView('chat')}>
            <i className="sidebar-bottom_icon bi bi-chat-dots text-light"></i></button>
          <button className="sidebar-bottom-btn btn"><i className="sidebar-bottom_icon bi bi-person-rolodex text-light"></i></button>
          <button className="sidebar-bottom-btn btn" onClick={() => setCurrentView('cloud')}>
            <i className="sidebar-bottom_icon bi bi-cloud text-light"></i></button>
          <button className="sidebar-bottom-btn btn active" onClick={() => setCurrentView('setting')}>
               <i className="sidebar-bottom_icon bi bi-gear text-light"></i></button>        
        </div>
      </div>

  {/* Chat Box */}
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
                        className='mode-select'
                        value={language} 
                        onChange={(e) => setLanguage(e.target.value)}
                    >
                        <option value="Tiếng Việt">Tiếng Việt</option>
                        <option value="English">English</option>
                    </select>
                </div>
                <div className="setting-item">
                    <label>Chế độ</label>
                    <select className='mode-select'
                        value={mode} 
                        onChange={(e) => setMode(e.target.value)}
                    >
                        <option value="Mặc định">Mặc định</option>
                        <option value="Dark Mode">Dark Mode</option>
                        <option value="Light Mode">Light Mode</option>
                    </select>
                </div>
                <button className="setting-item btn">
                    Đăng xuất
                </button>
            </div>
        </div>
</div>
);
}

export default Setting;