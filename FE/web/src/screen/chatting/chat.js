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
import updateChatRoom from "../../API/api_updateChatRoomforGroup.js";
import checkGroup from "../../API/api_checkGroup.js";
import getChatId from "../../API/api_getChatIdbyChatRoomId.js";
import deleteMember from "../../API/api_deleteMember.js"
import disbandGroup from "../../API/api_disbandGroup.js";

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
  const [revokedMessages, setRevokedMessages] = useState([]);
  console.log(revokedMessages);
  const [listAddtoGroup, setListAddtoGroup] = useState([])
  const [nameGroup, setNameGroup] = useState("")
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImage, setCurrentImage] = useState({
    src: "",
    name: "",
  });

  const [modalListFriends, setModalListFriends] = useState(false)
  const [listFriends, setListFriends] = useState([])
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);

  const handleOpenOptionsModal = () => {
    setIsOptionsModalOpen(true);
  };


  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const [replyingTo, setReplyingTo] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  const handleReplyMessage = (msg) => {
    setReplyingTo({
      ...msg,
      message:
        msg.type === "audio"
          ? "Tin nhắn thoại"
          : msg.type === "file"
            ? "File đính kèm"
            : msg.message,
    });
    setActiveMessageId(null);
    setHighlightedMessageId(msg.timestamp);
    const repliedMessageElement = document.getElementById(
      `message-${msg.timestamp}`
    );
    repliedMessageElement?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setHighlightedMessageId(null);
  };

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

  const handleMicClick = async () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const supportedMimeTypes = ["audio/webm", "audio/mp4"];
        const mimeType =
          supportedMimeTypes.find((type) =>
            MediaRecorder.isTypeSupported(type)
          ) || "audio/webm";
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
          sendAudioBlob(blob);
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Lỗi truy cập mic:", err);
        alert("Không thể truy cập microphone: " + err.message);
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
    if (chatRoom.status === "DISBANDED") {
      toast.error("Nhóm đã bị giải tán. Không thể gửi tin nhắn.");
      return;
    }
    const formData = new FormData();
    const chatId = await getChatId(chatRoom.chatRoomId);
    formData.append(
      "file",
      blob,
      `voice-${Date.now()}.${blob.type.split("/")[1]}`
    );
    formData.append("chatRoomId", chatRoom?.chatRoomId);
    formData.append("sender", currentUserPhone);
    formData.append("receiver", otherUserPhone);
    formData.append("chatId", chatId);

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
      alert("Không thể gửi tin nhắn thoại: " + err.message);
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
        const revoked = data.filter(msg => msg.isRevoked);
        if (revoked.length > 0) {
          setRevokedMessages(revoked.map(msg => msg.timestamp));
        }
      })
      .catch((err) => console.error("Error fetching messages:", err));

    socket.emit("joinRoom", chatRoom.chatRoomId);

    socket.on("receiveMessage", (newMessage) => {
      setMessages((prev) => {
        if (prev.some((msg) => msg.timestamp === newMessage.timestamp)) {
          return prev;
        }
        return [...prev, newMessage];
      });

      updateLastMessage(newMessage.chatRoomId, newMessage.message);
    });


    socket.on("userTyping", () => setTyping(true));
    socket.on("userStopTyping", () => setTyping(false));

    socket.on("messageRevoked", (data) => {
      setMessages((prev) =>
        prev.map(msg =>
          msg.timestamp === data.timestamp ? data : msg
        )
      );
      setRevokedMessages(prev => [...prev, data.timestamp]);
      if (data.lastMessage) {
        updateLastMessage(
          data.sender,
          data.receiver,
          data.lastMessage
        );
      }
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("userTyping");
      socket.off("userStopTyping");
      socket.off("messageRevoked");
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
    if (chatRoom.status === "DISBANDED") {
      toast.error("Nhóm đã bị giải tán. Không thể gửi tin nhắn.");
      return;
    }
    if (!message.trim()) return;

    // Lọc ra danh sách người nhận từ participants, bỏ người gửi
    const receivers = chatRoom?.participants?.filter(phone => phone !== currentUserPhone) || [];
    const chatId = await getChatId(chatRoom.chatRoomId);
    const newMsg = {
      chatRoomId: chatRoom?.chatRoomId || "",
      sender: currentUserPhone,
      receiver: receivers, // là mảng
      message,
      timestamp: Date.now(),
      type: "text",
      chatId,
      replyTo: replyingTo
        ? {
          timestamp: replyingTo.timestamp,
          message: replyingTo.message,
          sender: replyingTo.sender,
        }
        : null,
    };

    setMessage("");
    setReplyingTo(null);

    try {
      const response = await fetch("http://localhost:3618/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMsg),
      });

      if (!response.ok) throw new Error("Gửi tin nhắn thất bại!");

      receivers.forEach(phone => {
        updateLastMessage(currentUserPhone, phone, newMsg.message);
      });
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
    }
  };

  const handleRevokeMessage = async (messageId) => {
    try {
      const response = await fetch("http://localhost:3618/deleteMessage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatRoomId: chatRoom.chatRoomId,
          messageId: messageId,
        }),
      });
      if (!response.ok) throw new Error("Thu hồi tin nhắn thất bại!");
      setActiveMessageId(null);
    } catch (error) {
      console.error("Lỗi thu hồi tin nhắn:", error);
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
    if (chatRoom.status === "DISBANDED") {
      toast.error("Nhóm đã bị giải tán. Không thể gửi tin nhắn.");
      return;
    }
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const receivers = chatRoom?.participants?.filter(phone => phone !== currentUserPhone) || [];
    console.log(`Đang tải ${files.length} file lên`);
    setUploading(true);
    const chatId = await getChatId(chatRoom.chatRoomId);
    try {
      const formData = new FormData();

      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      formData.append("chatRoomId", chatRoom.chatRoomId);
      formData.append("sender", currentUserPhone);
      formData.append("receiver", receivers);
      formData.append("chatId", chatId);

      console.log("ChatRoomId:", chatRoom.chatRoomId);
      console.log("Sender:", currentUserPhone);
      console.log("Receiver:", receivers);
      console.log(`Số lượng file: ${files.length}`);

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

      const result = await response.json();
      console.log(`✅ Đã tải lên thành công ${files.length} file:`, result);

      fileInputRef.current.value = null;
    } catch (error) {
      console.error("Error uploading files:", error);
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const renderMessageContent = (msg) => {
    const isRevoked = msg.isRevoked;
    const isAudio = msg.type === "audio" || msg.originalType === "audio";
    const isFile = msg.type === "file" || msg.originalType === "file";

    if (isRevoked) {
      return (
        <p className="revoked-message">
          <i className="bi bi-clock-history"></i> {msg.message}
        </p>
      );
    } else if (isFile) {
      return renderFileMessage(msg);
    } else if (isAudio) {
      return (
        <div className="audio-message">
          <audio
            controls
            src={msg.fileInfo?.url || msg.message}
            type="audio/mpeg"
            style={{ marginTop: 5 }}
            onError={(e) => {
              console.error("Lỗi phát audio:", e.nativeEvent.error);
              alert(
                "Không thể phát tin nhắn thoại: " + e.nativeEvent.error.message
              );
            }}
          />
        </div>
      );
    } else {
      return (
        <p
          style={{
            borderRadius: "25px",
            color: "black",
            padding: "12px",
            width: "95%",
          }}
        >
          {msg.message}
        </p>
      );
    }
  };

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
  console.log("current chat room ", currentChatRoom)

  const handleOpenFriendsModal = async () => {
    if (chatRoom.isGroup) {
      openEditModal(chatRoom.chatRoomId);
    } else {
      openCreateModal();
    }
  };

  // Khi mở modal để tạo nhóm mới
  const openCreateModal = async () => {
    setNameGroup("");
    setListAddtoGroup([]);
    setIsEditMode(false);

    setModalListFriends(true);
    const data = await fetchFriends();
    setListFriends(data);
  };

  // Khi mở modal để edit nhóm hiện tại
  const openEditModal = async () => {
    if(chatRoom.status === 'DISBANDED'){
      toast.error("Nhóm đã bị giải tán, thao tác này đã bị khóa");
      return;
    }
    setNameGroup(chatRoom.nameGroup);
    const data = await fetchFriends();
    setListAddtoGroup([...chatRoom.participants]);
    setListFriends(data);
    setIsEditMode(true);
    setEditingRoomId(chatRoom.chatRoomId);
    setModalListFriends(true);
  };

  const handleSaveGroup = async () => {
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
        await updateChatRoom({
          roomId: chatRoom.chatRoomId,
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

      const refreshed = isEditMode ? await getChatRoom(editingRoomId) : await getChatRoom();

      if (Array.isArray(refreshed) && refreshed.length > 0) {
        setCurrentChatRoom(refreshed[0]);
        await checkGroup(refreshed[0].chatRoomId);
      } else {
        console.warn("Danh sách phòng chat trống.");
      }

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

  const [userMap, setUserMap] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      const map = {};
      for (const msg of messages) {
        if (!map[msg.sender]) {
          const result = await getUserbySearch(msg.sender, msg.sender);
          map[msg.sender] = result[0]; // hoặc {} nếu không có
        }
      }
      setUserMap(map);
    };

    if (messages.length > 0) {
      fetchUsers();
    }
  }, [messages]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!chatRoom || !Array.isArray(chatRoom.participants)) return;

      const fetched = await Promise.all(
        chatRoom.participants.map(async (phone) => {
          const result = await getUserbySearch(phone, "");
          return result[0];
        })
      );

      setMembers(fetched);
    };

    fetchMembers();
  }, [chatRoom]);


  const handleRemoveMember = async (phoneNumberToRemove, fullName) => {
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa thành viên ${fullName} khỏi nhóm không?`);

    if (confirmDelete) {
      try {
        const res = await deleteMember(chatRoom.chatRoomId, phoneNumberToRemove);
        console.log("Thành viên đã được xóa:", res);
        toast.success(`Xóa thành công ${fullName} khỏi nhóm`);
        setIsOptionsModalOpen(false);

      } catch (err) {
        console.error("Lỗi khi xóa thành viên:", err.message);
        toast.error("Xảy ra lỗi khi xóa thành viên!");
      }
    } else {
      console.log("Hủy xóa thành viên.");
    }

  };

  const handleDisbandGroup = async (chatRoomId) => {
    const confirm = window.confirm("Bạn có chắc muốn giải tán nhóm này không?");
    if (!confirm) return;

    try {
      const result = await disbandGroup(chatRoomId);
      toast.success(result.message);
      setIsOptionsModalOpen(false)

    } catch (error) {
      console.error("Lỗi khi giải tán nhóm:", error.message);
      toast.error("Đã xảy ra lỗi khi giải tán nhóm.");
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
                  {chatRoom.status === 'DISBANDED' && (
                    <span
                      className="badge bg-danger ms-2"
                    >NHÓM ĐÃ BỊ GIẢI TÁN</span>
                  )}
                </p>
              </div>
              <div className="col-sm-4 d-flex align-items-center justify-content-end">
                <button className="btn" onClick={handleOpenFriendsModal}>
                  <i className="bi bi-people-fill" style={{ fontSize: 25, color: '#fff' }}></i>
                </button>
                {chatRoom.isGroup && (
                  <button className="btn" onClick={handleOpenOptionsModal}>
                    <i className="bi bi-three-dots-vertical" style={{ fontSize: 25, color: '#fff' }}></i>
                  </button>
                )}
              </div>
            </div>

            {/* ===== Chat Messages ===== */}
            <div className="chat-messages">
              {messages.map((msg, index) => {
                const isSentByCurrentUser = msg.sender === currentUserPhone;
                const isHighlighted = highlightedMessageId === msg.timestamp;
                const senderUser = userMap[msg.sender];

                return (
                  <div
                    key={index}
                    id={`message-${msg.timestamp}`}
                    className={`message ${isSentByCurrentUser ? "sent" : "received"} ${isHighlighted ? "highlighted" : ""}`}
                  >
                    {!isSentByCurrentUser && (
                      <img
                        src={senderUser?.avatar || a1}
                        alt="User Avatar"
                        className="user-avt"
                      />
                    )}

                    <div className="message-wrapper">
                      <div className="message-info">

                        {chatRoom.isGroup && (
                          <span
                            className="sender-name"
                            style={{
                              fontWeight: "bold",
                              fontSize: "14px",
                              marginBottom: "5px",
                            }}
                          >
                            {msg.sender === currentUserPhone
                              ? ""
                              : senderUser?.fullName || msg.sender}
                          </span>
                        )}

                        {msg.replyTo && (
                          <div className="reply-preview">
                            <span>
                              {msg.replyTo.sender === currentUserPhone
                                ? "Bạn đã trả lời tin nhắn của mình"
                                : `Đã trả lời tin nhắn của ${userMap[msg.replyTo.sender]?.fullName || "người khác"}`}
                            </span>
                            <p
                              style={{
                                backgroundColor: "#3F4040",
                                color: "#B0B3B8",
                                fontSize: "13px",
                                margin: "5px 0 0 0",
                                padding: "10px ",
                                borderRadius: "20px",
                                maxWidth: "95%",
                                wordWrap: "break-word",
                                width: "fit-content",
                                cursor: "pointer",
                              }}
                              onClick={() => {
                                const repliedMessageElement = document.getElementById(`message-${msg.replyTo.timestamp}`);
                                repliedMessageElement?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "start",
                                });
                                setHighlightedMessageId(msg.replyTo.timestamp);
                              }}
                            >
                              {msg.replyTo.message}
                            </p>
                          </div>
                        )}

                        {/* Hiển thị nội dung tin nhắn */}
                        {renderMessageContent(msg)}

                        <span
                          className="timestamp"
                          style={{
                            color: "lightgrey",
                            fontSize: "12px",
                            marginLeft: "8px",
                            display: "block",
                          }}
                        >
                          {new Date(msg.timestamp).toLocaleString("en-US", {
                            timeZone: "Asia/Ho_Chi_Minh",
                            hour: "numeric",
                            minute: "numeric",
                            hour12: true,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Nút reply */}
                    <div className="message-options-container">
                      <button
                        className="message-options-btn reply-btn"
                        title="Trả lời"
                        onClick={() => handleReplyMessage(msg)}
                      >
                        <i className="bi bi-reply"></i>
                      </button>
                    </div>

                    {/* Nút thu hồi (nếu là của mình gửi) */}
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
                              onClick={() => handleRevokeMessage(msg.timestamp)}
                            >
                              <i className="bi bi-arrow-counterclockwise"></i> Thu hồi tin nhắn
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {isSentByCurrentUser && (
                      <img
                        src={user?.avatar || a1}
                        alt="User Avatar"
                        className="user-avt"
                      />
                    )}
                  </div>
                );
              })}

              {/* Trạng thái đang nhập / upload */}
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
              {replyingTo && (
                <div className="replying-to-message">
                  <p>Đang trả lời: {replyingTo.message}</p>

                  <button
                    onClick={handleCancelReply}
                    className="message-options-btn x"
                  >
                    X
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
                  {showPicker && (
                    <Picker data={data} onEmojiSelect={addEmoji} />
                  )}
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
                  name="files"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  className="btn"
                  onClick={handleFileButtonClick}
                  disabled={uploading}
                  title="Đính kèm nhiều file"
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
                  <p className="fw-bold">Thành viên hiện tại (<span>{chatRoom.participants.length} thành viên</span>)</p>
                  <ul className="list-group">
                    {chatRoom.participants.map((phone) => {
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
                          const members = chatRoom?.participants || [];
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

      {isOptionsModalOpen && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content p-0">
              <div className="modal-header d-flex justify-content-between align-items-center">
                <h5>Thông tin của nhóm</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsOptionsModalOpen(false)}
                ></button>
              </div>

              <div className="modal-body">
                <div className="modal-body_content p-3 rounded">
                  <div className="d-flex align-items-center justify-content-center mb-3"
                    style={{ position: 'relative' }}
                  >
                    <img
                      className="modal_avt me-2"
                      src={chatRoom.avatar || a1}
                      alt="avatar"
                      style={{ borderRadius: "50%" }}
                    />
                    <button className="btn btn-edit">
                      <i className="bi bi-pencil-fill text-light"></i>
                    </button>
                  </div>

                  <h6 className="text-white">Thành viên nhóm:</h6>
                  <ul className="list-group">
                    {members.map((member) => (
                      <li
                        key={member.phoneNumber}
                        className="list-group-item d-flex justify-content-between align-items-center li-mem-group"
                      >
                        <div className="d-flex align-items-center">
                          <img
                            src={member.avatar || a1}
                            alt="avatar"
                            style={{ width: 40, height: 40, borderRadius: "50%", marginRight: 10 }}
                          />
                          <span>{member.fullName || member.phoneNumber}</span>
                          {member.phoneNumber === chatRoom.admin && (
                            <span className="badge bg-primary ms-2">Admin</span>
                          )}

                        </div>

                        {user.phoneNumber === chatRoom.admin &&
                          member.phoneNumber !== user.phoneNumber && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleRemoveMember(member.phoneNumber, member.fullName)}
                            >
                              <i className="bi bi-x-circle-fill"></i>
                            </button>
                          )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>


              <div className="modal-footer">
                {currentUserPhone === chatRoom.admin && (
                  <button onClick={() => handleDisbandGroup(chatRoom.chatRoomId)} className="btn btn-danger w-100">
                    Giải tán nhóm
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}


    </>
  );
}

export default Chat;
