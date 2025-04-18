import React, { useState, useEffect, useRef } from "react";
import "./chat_style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import io from "socket.io-client";
import a1 from "../../assets/imgs/9306614.jpg";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { playNotificationSound } from "../../utils/sound.js";
import { toast } from "react-toastify";
import getUserbySearch from "../../API/api_searchUSer";
import fetchFriends from "../../API/api_getListFriends";
import createChatRoom from "../../API/api_createChatRoomforGroup"
import getChatRoom from "../../API/api_getMessagebyChatRoomId.js"
import updateChatRoom from "../../API/api_updateChatRoom.js";
import checkGroup from "../../API/api_checkGroup.js";

const socket = io("http://localhost:3618");
const notificationSocket = io("http://localhost:3515");

function Chat({ chatRoom, userChatting = [], user, updateLastMessage }) {
  console.log("Chat ", chatRoom)
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [currentUserPhone, setCurrentUserPhone] = useState();
  const [typing, setTyping] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [listAddtoGroup, setListAddtoGroup] = useState([])
  const [nameGroup, setNameGroup] = useState("")
  // Trạng thái cho modal xem ảnh
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImage, setCurrentImage] = useState({
    src: "",
    name: "",
  });

  const [modalListFriends, setModalListFriends] = useState(false)
  const [listFriends, setListFriends] = useState([])

  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const otherUserPhone = chatRoom?.participants?.find(
    (phone) => phone !== currentUserPhone
  );

  const addEmoji = (emoji) => {
    setMessage((prev) => prev + emoji.native);
    setShowPicker(false);
  };

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleOpenFriendsModal = async () => {
    setModalListFriends(true);
    const data = await fetchFriends();
    setListFriends(data);
  };

  const handleMicClick = async () => {
    if (isRecording) {
      // If already recording, stop and send the audio
      handleStopRecording();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const supportedMimeTypes = ["audio/webm", "audio/mp4"];
        const mimeType =
          supportedMimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || "audio/webm";
        const mediaRecorder = new MediaRecorder(stream, { mimeType });

        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          setAudioBlob(blob);
          setIsRecording(false);
          stream.getTracks().forEach((track) => track.stop());
          sendAudioBlob(blob); // Send the audio blob immediately after stopping
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Lỗi truy cập mic:", err);
      }
    }
  };

  const handleStopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleSendAudio = () => {
    if (isRecording) {
      handleStopRecording();
    } else if (audioBlob) {
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
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Gửi ghi âm thất bại: ${errorData.error || response.statusText}`
        );
      }
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
      .catch((err) => console.error("Error fetching messages:", err));

    socket.emit("joinRoom", chatRoom.chatRoomId);

    socket.on("receiveMessage", (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);

      // Cập nhật lastMessage
      updateLastMessage(
        newMessage.sender,
        newMessage.receiver,
        newMessage.message
      );
    });

    socket.on("userTyping", () => setTyping(true));
    socket.on("userStopTyping", () => setTyping(false));
    socket.on("messageDeleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((msg) => msg.timestamp !== messageId));
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
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowPicker(false);
      }
      // tắt menu khi click ra ngoài
      if (
        !event.target.closest(".message-options") &&
        !event.target.closest(".message-options-menu")
      ) {
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
    window.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEsc);
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
      type: "text",
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
          messageId: messageId,
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
        throw new Error(
          `Tải file lên thất bại: ${errorData.error || `Mã lỗi: ${response.status}`
          }`
        );
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
      const isImage = type.startsWith("image/");

      const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + " B";
        else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        else return (bytes / (1024 * 1024)).toFixed(1) + " MB";
      };

      const downloadFile = (e) => {
        e.preventDefault();

        const downloadUrl = `http://localhost:3618/download/${chatRoom.chatRoomId}/${msg.timestamp}`;

        const link = document.createElement("a");
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
                onClick={() =>
                  openImageModal(
                    `http://localhost:3618/view/${chatRoom.chatRoomId}/${msg.timestamp}`,
                    name
                  )
                }
              />
              <div className="file-info">
                <button
                  onClick={downloadFile}
                  className="file-name btn btn-link"
                >
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
                <button
                  onClick={downloadFile}
                  className="file-name btn btn-link"
                >
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

  const handleTogglePhoneNumber = (phoneNumber) => {
    setListAddtoGroup((prev) => {
      const mustHave = [user.phoneNumber, userChatting[0].phoneNumber];
      const withoutRemoved = prev.filter((p) => p !== phoneNumber);
      const isAlreadyChecked = prev.includes(phoneNumber);

      const newList = isAlreadyChecked
        ? withoutRemoved
        : [...prev, phoneNumber];

      const finalList = Array.from(new Set([...newList, ...mustHave]));
      return finalList;
    });
  };

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [currentChatRoom, setCurrentChatRoom] = useState(chatRoom);
  // Khi mở modal để tạo nhóm mới
  const openCreateModal = () => {
    setNameGroup("");
    setListAddtoGroup([]);
    setIsEditMode(false);
    setModalListFriends(true);
  };

  // Khi mở modal để edit nhóm hiện tại
  const openEditModal = async (roomId) => {
    const room = await getChatRoom(roomId);
    setCurrentChatRoom(room);
    setNameGroup(room.nameGroup);
    setListAddtoGroup([...room.participants]);
    setIsEditMode(true);
    setEditingRoomId(roomId);
    setModalListFriends(true);
  };

  const handleSaveGroup = async () => {
    console.log("list ", listAddtoGroup)
    if (!nameGroup.trim() || !/^(?! )[A-Za-zÀ-ỹ0-9 ]{3,50}$/.test(nameGroup)) {
      toast.error("Tên nhóm không hợp lệ.");
      return;
    }
    if (listAddtoGroup.length < 3) {
      toast.error("Một nhóm phải có ít nhất ba thành viên.");
      return;
    }

    try {
      if (isEditMode) {

        await updateChatRoom(editingRoomId, {
          nameGroup,
          participants: listAddtoGroup,
        });
        toast.success("Cập nhật nhóm thành công!");
      } else {
        await createChatRoom({
          nameGroup,
          createdBy: user.phoneNumber,
          participants: listAddtoGroup,
        });
        toast.success("Tạo nhóm thành công!");
      }


      const refreshed = isEditMode
        ? await getChatRoom(editingRoomId)
        : await getChatRoom();
      setCurrentChatRoom(refreshed);
      await checkGroup(refreshed.chatRoomId);

      setModalListFriends(false);
      setIsEditMode(false);
      setEditingRoomId(null);
      setNameGroup("");
      setListAddtoGroup([]);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Lưu nhóm thất bại!");
    }
  };


  return (
    <>
      <div className="chat-box container">
        {!chatRoom || !userChatting || userChatting.length === 0 ? (
          <p className="text-center mt-3 centered-text">
            Chưa có cuộc trò chuyện nào
          </p>
        ) : (
          <>
            {/* ===== Chat Header ===== */}
            <div className="chat-header row">
              <div className="col-sm-8 d-flex align-items-center">
                <img
                  className="chat-header_avt"
                  src={
                    chatRoom.isGroup
                      ? chatRoom.avatar || a1
                      : userChatting?.[0]?.avatar || a1
                  }
                  alt="avatar"
                />
                <p className="chat-header_name px-2 m-0">
                  {chatRoom.isGroup
                    ? chatRoom.nameGroup || userChatting.map((u) => u.fullName).join(", ")
                    : userChatting?.[0]?.fullName || "Người lạ"}
                </p>
              </div>
              <div className="col-sm-4 d-flex align-items-center justify-content-end">
                <button className="btn" onClick={handleOpenFriendsModal}>
                  <i className="bi bi-people-fill" style={{ fontSize: 25, color: '#fff' }}></i>
                </button>
              </div>
            </div>

            {/* ===== Chat Messages ===== */}
            <div className="chat-messages">
              {messages.map((msg, index) => {
                const isSentByCurrentUser = msg.sender === currentUserPhone;
                const isAudio = msg.type === "audio";
                const isFile = msg.type === "file";

                const senderUser = userChatting.find((u) => u.phoneNumber === msg.sender);

                return (
                  <div
                    key={index}
                    className={`message ${isSentByCurrentUser ? "sent" : "received"}`}
                  >
                    {/* Avatar người gửi */}
                    {!isSentByCurrentUser && (
                      <img
                        src={
                          chatRoom.isGroup
                            ? senderUser?.avatar || a1
                            : userChatting?.[0]?.avatar || a1
                        }
                        alt="User Avatar"
                        className="user-avt"
                      />
                    )}

                    <div className="message-wrapper">
                      <div className="message-info">
                        {/* Tên người gửi (nếu là group) */}
                        {chatRoom.isGroup && !isSentByCurrentUser && (
                          <span className="sender-name fw-bold">
                            {senderUser?.fullName || "Ẩn danh"}
                          </span>
                        )}

                        {/* Thời gian gửi */}
                        <span>
                          {new Date(msg.timestamp).toLocaleString("en-US", {
                            timeZone: "Asia/Ho_Chi_Minh",
                            hour: "numeric",
                            minute: "numeric",
                            hour12: true,
                          })}
                        </span>

                        {/* Nội dung tin nhắn */}
                        {isFile ? (
                          renderFileMessage(msg)
                        ) : isAudio ? (
                          <audio controls src={msg.message} style={{ marginTop: 5 }} />
                        ) : (
                          <p>{msg.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Tuỳ chọn với tin nhắn của mình */}
                    {isSentByCurrentUser && (
                      <>
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

                        {/* Avatar của mình */}
                        <img
                          src={user?.avatar || a1}
                          alt="User Avatar"
                          className="user-avt"
                        />
                      </>
                    )}
                  </div>
                );
              })}

              {typing && <p className="typing-indicator">Đang nhập...</p>}
              {uploading && <p className="typing-indicator">Đang tải file lên...</p>}
              <div ref={messagesEndRef}></div>
            </div>

            {/* ===== Chat Bottom ===== */}
            <div className="chat-bottom row" style={{ position: "relative" }}>
              {isRecording && (
                <div className="record-timer">
                  <span>Đang ghi âm...</span>
                  <button className="stop-btn" onClick={handleStopRecording}>
                    ⏹
                  </button>
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
                <div
                  className="emoji-picker-container"
                  ref={emojiPickerRef}
                  style={{ position: "absolute", bottom: "50px", left: "10px" }}
                >
                  {showPicker && <Picker data={data} onEmojiSelect={addEmoji} />}
                </div>

                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowPicker((prev) => !prev)}
                >
                  <i className="bi bi-emoji-smile text-light"></i>
                </button>

                <input
                  type="file"
                  name="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
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
        <div
          className="image-modal-overlay"
          onClick={() => setShowImageModal(false)}
        >
          <div
            className="image-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
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
              <img
                src={currentImage.src}
                alt={currentImage.name}
                className="image-modal-img"
              />
            </div>
            <div className="image-modal-footer">
              <button
                className="image-modal-download"
                onClick={() => {
                  const link = document.createElement("a");
                  const chatRoomId = chatRoom.chatRoomId;
                  const messageId = currentImage.src.split("/").pop();
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

      {modalListFriends && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content p-0">
              <div className="modal-header d-flex justify-content-between align-items-center">
                <h5 className="modal-title">Tạo Nhóm</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModalListFriends(false)}
                ></button>
              </div>

              <div className="modal-body">
                {/* Input tên nhóm */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Tên nhóm</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nhập tên nhóm..."
                    value={nameGroup}
                    onChange={(e) => setNameGroup(e.target.value)}
                  />
                </div>

                {/* Thành viên nhóm */}
                <div className="mb-3">
                  <p className="fw-bold">Thành viên hiện tại</p>
                  <ul className="list-group">
                    {chatRoom.participants.map((phone) => {
                      // Nếu là số của chính bạn thì dùng object `user`, ngược lại tìm trong `userChatting`
                      const member =
                        phone === user.phoneNumber
                          ? user
                          : userChatting.find((u) => u.phoneNumber === phone);

                      return (
                        <li
                          key={phone}
                          className="list-group-item d-flex align-items-center li-mem-group"
                        >
                          <img
                            src={member?.avatar || "/img/default-user.png"}
                            alt="avatar"
                            className="rounded-circle me-2"
                            style={{ width: 40, height: 40, objectFit: "cover" }}
                          />
                          <span>{member?.fullName || phone}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Danh sách bạn bè có thể thêm */}
                {listFriends.length === 0 ? (
                  <p className="text-muted">Không có bạn bè nào.</p>
                ) : (
                  <div>
                    <p className="fw-bold">Những người bạn có thể thêm vào nhóm</p>
                    <ul className="list-group">
                      {listFriends
                        .filter((friend) => {
                          // Lấy mảng số điện thoại thành viên hiện tại
                          const members = chatRoom?.participants || [];
                          // Giữ lại những friend chưa có trong members
                          return !members.includes(friend.phoneNumber);
                        })
                        .map((friend) => (
                          <li
                            key={friend.phoneNumber}
                            className="list-group-item d-flex justify-content-between align-items-center li-mem-group"
                            style={{
                              padding: "10px 15px",
                              borderRadius: "8px",
                              marginBottom: "8px",
                              boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                              transition: "background-color 0.3s",
                            }}
                          >
                            <div className="d-flex align-items-center">
                              <img
                                src={friend.avatar}
                                alt="avatar"
                                className="rounded-circle"
                                style={{
                                  width: 45,
                                  height: 45,
                                  objectFit: "cover",
                                  marginRight: 12,
                                }}
                              />
                              <span style={{ fontWeight: 500 }}>{friend.fullName}</span>
                            </div>
                            <input
                              type="checkbox"
                              style={{ transform: "scale(1.2)" }}
                              value={friend.phoneNumber}
                              onChange={() => handleTogglePhoneNumber(friend.phoneNumber)}
                              checked={listAddtoGroup.includes(friend.phoneNumber)}
                            />
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-primary w-100"
                  onClick={handleSaveGroup}
                >
                  {isEditMode ? "Lưu thay đổi" : "Tạo nhóm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



    </>
  );
}

export default Chat;
