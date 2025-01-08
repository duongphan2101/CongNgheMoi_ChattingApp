import React, { useState } from 'react';
import './cloud_style.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import a1 from '../../assets/imgs/9306614.jpg';
import a2 from '../../assets/imgs/9334176.jpg';
import a3 from '../../assets/imgs/1.jpg';

function Chat({setCurrentView}) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { text: 'This is my cloud', time: '11:40 AM', sender: 'sent' },
    { text: 'Template', time: '11:44 AM', sender: 'sent' }
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
    <div className="container chat-container">
      {/* Intro Animation */}
      {/* <div className="intro-animation">
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
          <button className="sidebar-bottom-btn btn active" onClick={() => setCurrentView('cloud')}><i className="sidebar-bottom_icon bi bi-cloud text-light"></i></button>
          <button className="sidebar-bottom-btn btn" onClick={() => setCurrentView('setting')}>
               <i className="sidebar-bottom_icon bi bi-gear text-light"></i></button>        
</div>
      </div>

      {/* Chat Box */}
      <div className="chat-box container">
        <div className="chat-header row">
          <div className="col-sm-3 d-flex align-items-center">
            <i className="sidebar-bottom_icon bi bi-cloud text-light"></i>
            <p className="chat-header_name px-2 m-0">Cloud</p>
          </div>
          <div className="col-sm-6"></div>
          <div className="col-sm-3"></div>
        </div>

        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              {/* {msg.sender === 'sent' && <img className="chat-message_avt" src="./imgs/avt.jpg" alt="" />} */}
              <div className="message-info">
                <span>{msg.time}</span>
                <p>{msg.text}</p>
              </div>
              {/* {msg.sender === 'received' && <img className="chat-message_avt" src="./imgs/9306614.jpg" alt="" />} */}
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
