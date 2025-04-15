import React, { useState, useEffect, useRef } from "react";
import "./chat_style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import io from "socket.io-client";
import a1 from "../../assets/imgs/9306614.jpg";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { playNotificationSound } from '../../utils/sound.js';
import { toast } from "react-toastify";
import getUserbySearch from "../../API/api_searchUSer";

const socket = io("http://localhost:3618");
const notificationSocket = io("http://localhost:3515");

function Chat({ chatRoom, userChatting = [], user, updateLastMessage }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [currentUserPhone, setCurrentUserPhone] = useState();
  const [typing, setTyping] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Trạng thái cho modal xem ảnh
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImage, setCurrentImage] = useState({
    src: "",
    name: ""
  });

  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const otherUserPhone = chatRoom?.participants?.find(phone => phone !== currentUserPhone);

  const addEmoji = (emoji) => {
    setMessage((prev) => prev + emoji.native);
    setShowPicker(false);
  };

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleMicClick = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          setAudioBlob(blob);
          setIsRecording(false);
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Lỗi truy cập mic:", err);
      }
    }
  };

  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const handleSendAudio = () => {
    if (isRecording) {
      // Nếu vẫn đang ghi âm, dừng lại và gửi sau khi đã xử lý xong
      const mediaRecorder = mediaRecorderRef.current;
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          setAudioBlob(blob);
          setIsRecording(false);

          // Tiến hành gửi ngay sau khi blob đã được tạo
          sendAudioBlob(blob);
        };
        mediaRecorder.stop();
      }
    } else if (audioBlob) {
      // Nếu đã có blob, gửi luôn
      sendAudioBlob(audioBlob);
    }
  };

  const sendAudioBlob = async (blob) => {
    const formData = new FormData();
    formData.append("file", blob, "voice.webm");
    formData.append("chatRoomId", chatRoom?.chatRoomId);
    formData.append("sender", currentUserPhone);
    formData.append("receiver", otherUserPhone);

    try {
      const response = await fetch("http://localhost:3618/sendAudio", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Gửi ghi âm thất bại");
      const audioMessage = await response.json();
      console.log("Gửi ghi âm thành công:", audioMessage);

      setAudioBlob(null);
    } catch (err) {
      console.error("Lỗi khi gửi ghi âm:", err);
    }
  };

  useEffect(() => {
    if (!user?.phoneNumber) return;

    notificationSocket.emit("join", user.phoneNumber);

    notificationSocket.on("notification", async (data) => {
      try {
        if (data.from === user.phoneNumber) return;
        let senderName;

        const senderInfo = (await getUserbySearch(data.from, data.from))[0];
        senderName = senderInfo?.fullName || data.from;

        playNotificationSound();
        if (data.type === "new_message") {
          toast.info(`Tin nhắn từ ${senderName}: ${data.message}`, {
            position: "bottom-right",
            autoClose: 5000,
          });
        } else if (data.type === "file") {
          toast.info(`Nhận được một file từ ${senderName}`, {
            position: "bottom-right",
            autoClose: 5000,
          });
        } else if (data.type === "audio") {
          toast.info(`Nhận được một tin nhắn thoại từ ${senderName}`, {
            position: "bottom-right",
            autoClose: 5000,
          });
        }
      } catch (err) {
        console.error("Lỗi khi xử lý notification:", err);
      }
    });

    return () => {
      notificationSocket.off("notification");
    };
  }, [user?.phoneNumber]);

  useEffect(() => {
    if (!chatRoom?.chatRoomId) return;
    setCurrentUserPhone(user.phoneNumber);
    fetch(`http://localhost:3618/messages?chatRoomId=${chatRoom.chatRoomId}`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data);
      })
      .catch(err => console.error("Error fetching messages:", err));

    socket.emit("joinRoom", chatRoom.chatRoomId);

    socket.on("receiveMessage", (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);

      // Cập nhật lastMessage
      updateLastMessage(newMessage.sender, newMessage.receiver, newMessage.message);
    });

    socket.on("userTyping", () => setTyping(true));
    socket.on("userStopTyping", () => setTyping(false));
    socket.on("messageDeleted", ({ messageId }) => {
      setMessages((prev) => prev.filter(msg => msg.timestamp !== messageId));
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("userTyping");
      socket.off("userStopTyping");
      socket.off("messageDeleted");
    };
  }, [chatRoom?.chatRoomId, user.phoneNumber, updateLastMessage]);

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
      // tắt menu khi click ra ngoài
      if (!event.target.closest('.message-options') && !event.target.closest('.message-options-menu')) {
        setActiveMessageId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    // Thêm xử lý khi nhấn ESC để đóng modal
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        setShowImageModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
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
      type: "text"
    };
    setMessage("");
    try {
      const response = await fetch("http://localhost:3618/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMsg),
      });
      if (!response.ok) throw new Error("Gửi tin nhắn thất bại!");

      // Cập nhật lastMessage trong danh sách userChatList
      updateLastMessage(currentUserPhone, otherUserPhone, newMsg.message);
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await fetch("http://localhost:3618/deleteMessage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatRoomId: chatRoom.chatRoomId,
          messageId: messageId
        }),
      });
      if (!response.ok) throw new Error("Xóa tin nhắn thất bại!");
      setActiveMessageId(null);
    } catch (error) {
      console.error("Lỗi xóa tin nhắn:", error);
    }
  };

  const toggleMessageOptions = (messageId) => {
    if (activeMessageId === messageId) {
      setActiveMessageId(null);
    } else {
      setActiveMessageId(messageId);
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log("Đang tải file lên:", file.name);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("chatRoomId", chatRoom.chatRoomId);
      formData.append("sender", currentUserPhone);
      formData.append("receiver", otherUserPhone);

      console.log("ChatRoomId:", chatRoom.chatRoomId);
      console.log("Sender:", currentUserPhone);
      console.log("Receiver:", otherUserPhone);

      const response = await fetch("http://localhost:3618/uploadFile", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Lỗi Server:", response.status, errorData);
        throw new Error(`Tải file lên thất bại: ${errorData.error || `Mã lỗi: ${response.status}`}`);
      }

      fileInputRef.current.value = null;
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  // Hàm mở modal xem ảnh
  const openImageModal = (src, name) => {
    setCurrentImage({ src, name });
    setShowImageModal(true);
  };

  const renderFileMessage = (msg) => {
    try {
      const fileInfo = JSON.parse(msg.message);
      const { name, size, type } = fileInfo;
      const isImage = type.startsWith('image/');

      const formatFileSize = (bytes) => {
        if (bytes < 1024)
          return bytes + ' B';
        else if (bytes < 1024 * 1024)
          return (bytes / 1024).toFixed(1) + ' KB';
        else
          return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
      };

      const downloadFile = (e) => {
        e.preventDefault();

        const downloadUrl = `http://localhost:3618/download/${chatRoom.chatRoomId}/${msg.timestamp}`;

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      return (
        <div className="file-message">
          {isImage ? (
            <div className="file-preview">
              <img
                src={`http://localhost:3618/view/${chatRoom.chatRoomId}/${msg.timestamp}`}
                alt={name}
                className="img-preview"
                onClick={() => openImageModal(`http://localhost:3618/view/${chatRoom.chatRoomId}/${msg.timestamp}`, name)}
              />
              <div className="file-info">
                <button onClick={downloadFile} className="file-name btn btn-link">
                  {name}
                </button>
                <span className="file-size">{formatFileSize(size)}</span>
              </div>
            </div>
          ) : (
            <>
              <div className="file-icon">
                <i className="bi bi-file-earmark"></i>
              </div>
              <div className="file-info">
                <button onClick={downloadFile} className="file-name btn btn-link">
                  {name}
                </button>
                <span className="file-size">{formatFileSize(size)}</span>
              </div>
            </>
          )}
        </div>
      );
    } catch (error) {
      console.error("Lỗi khi xử lý nội dung file:", error);
      return <p>Không thể hiển thị nội dung file này</p>;
    }
  };

  return (
    <>
      <div className="chat-box container">
        {!chatRoom || !userChatting.length ? (
          <p className="text-center mt-3 centered-text">Chưa có cuộc trò chuyện nào</p>
        ) : (
          <>
            <div className="chat-header row">
              <div className="col-sm-12 d-flex align-items-center">
                <img className="chat-header_avt" src={userChatting[0]?.avatar || a1} alt="" />
                <p className="chat-header_name px-2 m-0">{userChatting[0]?.fullName || "VChat!"}</p>
              </div>
            </div>

            <div className="chat-messages">
              {messages.map((msg, index) => {
                const isSentByCurrentUser = msg.sender === currentUserPhone;
                const isAudio = msg.type === "audio";
                const isFile = msg.type === "file";

                return (
                  <div key={index} className={`message ${isSentByCurrentUser ? "sent" : "received"}`}>
                    {!isSentByCurrentUser && (
                      <img src={userChatting[0]?.avatar || a1} alt="User Avatar" className="user-avt" />
                    )}
                    <div className="message-wrapper">
                      <div className="message-info">
                        <span>
                          {new Date(msg.timestamp).toLocaleString("en-US", {
                            timeZone: "Asia/Ho_Chi_Minh",
                            hour: "numeric",
                            minute: "numeric",
                            hour12: true,
                          })}
                        </span>
                        {isFile ? (
                          renderFileMessage(msg)
                        ) : isAudio ? (
                          <audio controls src={msg.message} style={{ marginTop: 5 }} />
                        ) : (
                          <p>{msg.message}</p>
                        )}
                      </div>
                    </div>
                    {isSentByCurrentUser && (
                      <div className="message-options-container">
                        <button
                          className="message-options-btn"
                          onClick={() => toggleMessageOptions(msg.timestamp)}
                        >
                          <i className="bi bi-three-dots-vertical"></i>
                        </button>
                        {activeMessageId === msg.timestamp && (
                          <div className="message-options-menu">
                            <button
                              className="message-option-item"
                              onClick={() => handleDeleteMessage(msg.timestamp)}
                            >
                              <i className="bi bi-trash"></i> Xóa tin nhắn
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {isSentByCurrentUser && (
                      <img src={user?.avatar || a1} alt="User Avatar" className="user-avt" />
                    )}
                  </div>
                );
              })}
              {typing && <p className="typing-indicator">Đang nhập...</p>}
              {uploading && <p className="typing-indicator">Đang tải file lên...</p>}
              <div ref={messagesEndRef}></div>
            </div>

            <div className="chat-bottom row" style={{ position: "relative" }}>
              {isRecording && (
                <div className="record-timer">
                  <span>Đang ghi âm...</span>
                  <button className="stop-btn" onClick={handleStopRecording}>⏹</button>
                </div>
              )}

              <form
                className="chat-input"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                  handleSendAudio();
                }}
              >
                <div className="emoji-picker-container" ref={emojiPickerRef} style={{ position: "absolute", bottom: "50px", left: "10px" }}>
                  {showPicker && <Picker data={data} onEmojiSelect={addEmoji} />}
                </div>
                <button type="button" className="btn" onClick={() => setShowPicker((prev) => !prev)}>
                  <i className="bi bi-emoji-smile text-light"></i>
                </button>

                <input type="file" name="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
                <button
                  type="button"
                  className="btn"
                  onClick={handleFileButtonClick}
                  disabled={uploading}
                >
                  <i className="bi bi-file-earmark-arrow-up text-light"></i>
                </button>

                <button type="button" className="btn" onClick={handleMicClick}>
                  <i className="bi bi-mic text-light"></i>
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


      {/* Modal xem ảnh */}
      {showImageModal && (
        <div className="image-modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="image-modal-header">
              <h5 className="image-modal-title">{currentImage.name}</h5>
              <button
                className="image-modal-close"
                onClick={() => setShowImageModal(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="image-modal-body">
              <img src={currentImage.src} alt={currentImage.name} className="image-modal-img" />
            </div>
            <div className="image-modal-footer">
              <button
                className="image-modal-download"
                onClick={() => {
                  const link = document.createElement('a');
                  const chatRoomId = chatRoom.chatRoomId;
                  const messageId = currentImage.src.split('/').pop();
                  link.href = `http://localhost:3618/download/${chatRoomId}/${messageId}`;
                  link.download = currentImage.name;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <i className="bi bi-download"></i> Tải xuống
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Chat;