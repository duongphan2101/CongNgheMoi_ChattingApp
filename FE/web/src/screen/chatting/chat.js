import React, { useState, useEffect, useRef } from "react";
import "./chat_style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import io from "socket.io-client";
import a1 from "../../assets/imgs/9306614.jpg";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

const socket = io("http://localhost:3618");

function Chat({ chatRoom, userChatting = [], user }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [currentUserPhone, setCurrentUserPhone] = useState();
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const [showPicker, setShowPicker] = useState(false);
  const otherUserPhone = chatRoom?.participants?.find(phone => phone !== currentUserPhone);

  const addEmoji = (emoji) => {
    setMessage((prev) => prev + emoji.native);
    setShowPicker(false);
  };

  useEffect(() => {
    if (!chatRoom?.chatRoomId) return;
    setCurrentUserPhone(user.phoneNumber);
    fetch(`http://localhost:3618/messages?chatRoomId=${chatRoom.chatRoomId}`)
      .then((res) => res.json())
      .then((data) => setMessages(data));

    socket.emit("joinRoom", chatRoom.chatRoomId);
    socket.on("receiveMessage", (newMessage) => setMessages((prev) => [...prev, newMessage]));
    socket.on("userTyping", () => setTyping(true));
    socket.on("userStopTyping", () => setTyping(false));

    return () => {
      socket.off("receiveMessage");
      socket.off("userTyping");
      socket.off("userStopTyping");
    };
  }, [chatRoom?.chatRoomId, user.phoneNumber]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (event) => {
    setMessage(event.target.value);
    socket.emit("typing", chatRoom?.chatRoomId);
    setTimeout(() => socket.emit("stopTyping", chatRoom?.chatRoomId), 2000);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    const newMsg = {
      chatRoomId: chatRoom?.chatRoomId || "",
      sender: currentUserPhone,
      receiver: otherUserPhone,
      message,
      timestamp: Date.now(),
    };
    setMessage("");
    try {
      const response = await fetch("http://localhost:3618/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMsg),
      });
      if (!response.ok) throw new Error("Gửi tin nhắn thất bại!");
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
    }
  };

  return (
    <div className="chat-box container">
      {!chatRoom || !userChatting.length ? (
        <p className="text-center mt-3 centered-text">Chưa có cuộc trò chuyện nào</p>
      ) : (
        <>
          <div className="chat-header row">
            <div className="col-sm-12 d-flex align-items-center">
              <img className="chat-header_avt" src={userChatting[0]?.avatar || a1} alt="" />
              <p className="chat-header_name px-2 m-0">
                {userChatting[0]?.fullName || "VChat!"}
              </p>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((msg, index) => {
              const isSentByCurrentUser = msg.sender === currentUserPhone;
              return (
                <div key={index} className={`message ${isSentByCurrentUser ? "sent" : "received"}`}>
                  {!isSentByCurrentUser && <img src={userChatting[0]?.avatar} alt="User Avatar" className="user-avt" />}
                  <div className="message-info">
                    <span>
                      {new Date(msg.timestamp).toLocaleString("en-US", {
                        timeZone: "Asia/Ho_Chi_Minh",
                        hour: "numeric",
                        minute: "numeric",
                        hour12: true,
                      })}
                    </span>
                    <p>{msg.message}</p>
                  </div>
                  {isSentByCurrentUser && (
                    <img src={user?.avatar || a1} alt="User Avatar" className="user-avt" />
                  )}
                </div>
              );
            })}
            {typing && <p className="typing-indicator">Đang nhập...</p>}
            <div ref={messagesEndRef}></div>
          </div>

          <div className="chat-bottom row" style={{position: "relative"}}>
            <form
              className="chat-input"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <div className="emoji-picker-container" ref={emojiPickerRef} style={{ position: "absolute", bottom: "50px", left: "10px" }} >
                {showPicker && <Picker data={data} onEmojiSelect={addEmoji} />}
              </div>
              <button className="btn" onClick={() => setShowPicker((prev) => !prev)}>
                <i className="bi bi-emoji-smile text-light"></i>
              </button>
              <button className="btn">
                <i className="bi bi-file-earmark-arrow-up text-light"></i>
              </button>
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
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