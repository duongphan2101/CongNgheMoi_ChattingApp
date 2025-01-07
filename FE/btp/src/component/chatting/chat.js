import React, { useState } from 'react';
import './chat_style.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function Chat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { text: 'Hi, how are you?', time: '11:40 AM', sender: 'sent' },
    { text: 'Hi, I am good. Thank you, how about you?', time: '11:41 AM', sender: 'received' },
    { text: 'I am good too, thank you for your chat template.', time: '11:44 AM', sender: 'sent' }
  ]);

  const handleInputChange = (event) => {
    setMessage(event.target.value);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, { text: message, time: new Date().toLocaleTimeString(), sender: 'sent' }]);
      setMessage('');
    }
  };

  return (
    <div className="container chat-container border">
      {/* Intro Animation */}
      <div className="intro-animation">
        <p>Welcome!</p>
        <p style={{ fontSize: '34px', fontWeight: 'bold' }}>VChat</p>
      </div>

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
          <button className="sidebar-bottom-btn btn active"><i className="sidebar-bottom_icon bi bi-chat-dots text-light"></i></button>
          <button className="sidebar-bottom-btn btn"><i className="sidebar-bottom_icon bi bi-person-rolodex text-light"></i></button>
          <button className="sidebar-bottom-btn btn"><i className="sidebar-bottom_icon bi bi-cloud text-light"></i></button>
          <button className="sidebar-bottom-btn btn"><i className="sidebar-bottom_icon bi bi-gear text-light"></i></button>
        </div>
      </div>

      {/* Chat Box */}
      <div className="chat-box container">
        <div className="chat-header row">
          <div className="col-sm-3 d-flex align-items-center">
            <img className="chat-header_avt" src="./imgs/9306614.jpg" alt="" />
            <p className="chat-header_name">Khalid</p>
          </div>
          <div className="col-sm-6">
            <button className="btn"><i className="chat-header_icon mx-2 bi bi-camera-video"></i></button>
            <button className="btn"><i className="chat-header_icon mx-2 bi bi-telephone"></i></button>
          </div>
          <div className="col-sm-3 d-flex justify-content-end">
            <button className="btn"><i className="chat-header_icon bi bi-three-dots-vertical"></i></button>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              {msg.sender === 'sent' && <img className="chat-message_avt" src="./imgs/avt.jpg" alt="" />}
              <div className="message-info">
                <span>{msg.time}</span>
                <p>{msg.text}</p>
              </div>
              {msg.sender === 'received' && <img className="chat-message_avt" src="./imgs/9306614.jpg" alt="" />}
            </div>
          ))}
        </div>

        <div className="chat-bottom row">
          <form className="chat-input" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
            <button className="btn"><i className="bi bi-emoji-smile text-light"></i></button>
            <button className="btn"><i className="bi bi-file-earmark-arrow-up text-light"></i></button>
            <input 
              type="text" 
              placeholder="Type your message..." 
              value={message} 
              onChange={handleInputChange}
            />
            <button className="btn btn-link" type="submit">
              <i className="bi bi-send-fill"></i>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Chat;
