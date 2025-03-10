import React, { useState } from "react";
import "./chat_style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import a1 from "../../assets/imgs/9306614.jpg";
// import a2 from "../../assets/imgs/9334176.jpg";
// import a3 from "../../assets/imgs/1.jpg";

function Chat() {
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([
    { text: "Hi, how are you?", time: "11:40 AM", sender: "sent" },
    {
      text: "Hi, I am good. Thank you, how about you?",
      time: "11:41 AM",
      sender: "received",
    },
    {
      text: "I am good too, thank you for your chat template.",
      time: "11:44 AM",
      sender: "sent",
    },
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
            <img className="chat-header_avt" src={a1} alt="" />
            <p className="chat-header_name px-2 m-0">Khalid</p>
          </div>
          <div className="col-sm-6">
            <button className="btn">
              <i className="chat-header_icon mx-2 bi bi-camera-video"></i>
            </button>
            <button className="btn">
              <i className="chat-header_icon mx-2 bi bi-telephone"></i>
            </button>
          </div>
          <div className="col-sm-3 d-flex justify-content-end">
            <button className="btn">
              <i className="chat-header_icon bi bi-three-dots-vertical"></i>
            </button>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <div className="message-info">
                <span>{msg.time}</span>
                <p>{msg.text}</p>
              </div>
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