import React, { useState, useEffect } from "react";
import "./chat_style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import a1 from "../../assets/imgs/9306614.jpg";
import getMessage from "../../API/api_getMessagebyChatRoomId";

function Chat({ chatRoom, userChatting = [] }) {
  const [message, setMessage] = useState("");
  const chatting = Array.isArray(userChatting) && userChatting.length > 0 ? userChatting[0] : null;
  const [messages, setMessages] = useState([]);
  const [currentUserPhone, setCurrentUserPhone] = useState("");

  useEffect(() => {
    if (chatRoom && Array.isArray(chatRoom.participants) && chatRoom.participants.length > 0) {
      setCurrentUserPhone(chatRoom.participants[0]);
    }
  }, [chatRoom]);
  useEffect(() => {
    const fetchMessages = async () => {
      if (chatRoom && chatRoom.chatRoomId) {
        try {
          const messagesData = await getMessage(chatRoom.chatRoomId);
          setMessages(messagesData || []);
        } catch (error) {
          console.error("Lỗi khi lấy tin nhắn:", error);

        }
      }
    };

    fetchMessages();
  }, [chatRoom]);

  const handleInputChange = (event) => {
    setMessage(event.target.value);
  };


  const handleSendMessage = () => {
  if (message.trim()) {
    setMessages([
      ...messages,
      {
        message: message,
        timestamp: Date.now(),
        sender: currentUserPhone,
        receiver: chatRoom.participants.find(p => p !== currentUserPhone)
      },
    ]);
    setMessage("");
  }
};


  return (
    <div className="chat-box container">
      {(!chatRoom || Object.keys(chatRoom).length === 0 || !userChatting || userChatting.length === 0) ? (
        <p className="text-center mt-3 centered-text">Chưa có cuộc trò chuyện nào</p>
      ) : (
        <>
          <div className="chat-header row">
            <div className="col-sm-3 col-md-3 d-flex align-items-center">
              <img className="chat-header_avt"
                src={userChatting[0]?.avatar || a1}
                alt="" />
              <p className="chat-header_name px-2 m-0">
                {userChatting[0]?.fullName || "VChat!"}
              </p>
            </div>
            <div className="col-sm-9 col-md-9 d-flex justify-content-end">
              <button className="btn">
                <i className="chat-header_icon bi bi-three-dots-vertical"></i>
              </button>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((msg, index) => {
              const isSentByCurrentUser = msg.sender === currentUserPhone; // Kiểm tra người gửi
              return (
                <div key={index} className={`message ${isSentByCurrentUser ? "sent" : "received"}`}>
                  <div className="message-info">
                    <span>{new Date(msg.timestamp).toLocaleString("en-US", {
                      timeZone: "Asia/Ho_Chi_Minh",
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true
                    })}</span>
                    <p>{msg.message}</p>
                  </div>
                </div>
              );
            })}
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
        </>
      )}
    </div>
  );

}

export default Chat;