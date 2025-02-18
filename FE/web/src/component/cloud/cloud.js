import React, { useState } from "react";
import "./cloud_style.css";
import "bootstrap/dist/css/bootstrap.min.css";

function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { text: "This is my cloud", time: "11:40 AM", sender: "sent" },
    { text: "Template", time: "11:44 AM", sender: "sent" },
  ]);

  const handleInputChange = (event) => {
    setMessage(event.target.value);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([
        ...messages,
        {
          text: message,
          time: new Date().toLocaleTimeString(),
          sender: "sent",
        },
      ]);
      setMessage("");
    }
  };

  return (
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
        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <button className="btn">
            <i className="bi bi-emoji-smile text-light"></i>
          </button>
          <button className="btn">
            <i className="bi bi-file-earmark-arrow-up text-light"></i>
          </button>
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
  );
}

export default Chat;
