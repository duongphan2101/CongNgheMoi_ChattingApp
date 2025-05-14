import React, { useState, useEffect, useRef, useContext } from "react";
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
import createChatRoom from "../../API/api_createChatRoomforGroup";
import getChatRoom from "../../API/api_getMessagebyChatRoomId.js";
import updateChatRoom from "../../API/api_updateChatRoomforGroup.js";
import checkGroup from "../../API/api_checkGroup.js";
import getChatId from "../../API/api_getChatIdbyChatRoomId.js";
import { LanguageContext, locales } from "../../contexts/LanguageContext";
import ShowModal from "../showModal/showModal.js";
import useFetchChatRoom from "../../hooks/getChatRoom.js";

const socket = io("http://localhost:3618");
const notificationSocket = io("http://localhost:3515");

function Chat({
  phongChat,
  userChatting = [],
  user,
  updateLastMessage,
  onUpdateChatRoom,
}) {
function Chat({
  phongChat,
  userChatting = [],
  user,
  updateLastMessage,
  onUpdateChatRoom,
}) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [currentUserPhone, setCurrentUserPhone] = useState();
  const [typing, setTyping] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [revokedMessages, setRevokedMessages] = useState([]);
  const [, setHoveredMessageId] = useState(null);
  const [showReactions, setShowReactions] = useState(null);
  const [messageReactions, setMessageReactions] = useState({});
  const [activeReactionTooltip, setActiveReactionTooltip] = useState(null);
  const [listAddtoGroup, setListAddtoGroup] = useState([]);
  const [nameGroup, setNameGroup] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const { language } = useContext(LanguageContext);
  const t = locales[language];
  const [currentImage, setCurrentImage] = useState({
    src: "",
    name: "",
  });

  const [modalListFriends, setModalListFriends] = useState(false);
  const [listFriends, setListFriends] = useState([]);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [chatRoom, setChatRoom] = useState(null);

  // State cho tính năng tag tên
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionList, setSuggestionList] = useState([]);
  const [tagQuery, setTagQuery] = useState("");
  const [userMap, setUserMap] = useState({});

  // State cho modal đổi tên nhóm
  const [showNameModal, setShowNameModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const cr = useFetchChatRoom(phongChat?.chatRoomId);

  useEffect(() => {
    if (cr) {
      setChatRoom(cr);
    }
  }, [cr]);

  useEffect(() => {
    if (!user?.phoneNumber) return;

    socket.emit("joinUser", user.phoneNumber);
  }, [user?.phoneNumber]);

  useEffect(() => {
    const handleUpdate = (data) => {
      const isStillInGroup = data.participants.includes(user.phoneNumber);
      if (!isStillInGroup) {
        toast.info(t.updateGroupNotificationRemoved);
        setChatRoom(null);
        setIsInfoModalOpen(false);
        setShowNameModal(false);
        setModalListFriends(false);
        setShowImageModal(false);
        return;
      }

      const isNewMember =
        !chatRoom?.participants?.includes(user.phoneNumber) &&
        data.participants.includes(user.phoneNumber);
      setChatRoom((prev) => {
        if (!prev) {
          return prev;
        }
        const updated = {
          ...prev,
          nameGroup: data.groupName,
          fullName: data.groupName,
          participants: data.participants,
          admin: data.admin,
        };
        return updated;
      });

      if (isNewMember) {
        toast.info(t.updateGroupNotification4 + data.groupName);
      } else {
        toast.success(
          t.updateGroupNotification +
            data.groupName +
            t.updateGroupNotification2
        );
      }
    };

    const handleOutGroup = (data) => {
      const isCurrentUser = data.phoneNumber === user.phoneNumber;

      if (isCurrentUser) {
        setChatRoom(null);
        setIsInfoModalOpen(false);
        setShowNameModal(false);
        setModalListFriends(false);
        setShowImageModal(false);
      } else {
        setChatRoom((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            participants: prev.participants.filter(
              (p) => p !== data.phoneNumber
            ),
          };
        });
      }
    };

    const handleDisband = (data) => {
      toast.info("Nhóm đã bị giải tán.");

      setChatRoom((prev) => {
        if (!prev) return prev;
        if (prev.chatRoomId !== data.chatRoomId) return prev;

        return {
          ...prev,
          status: data.status,
        };
      });

      setIsInfoModalOpen(false);
      setShowNameModal(false);
      setModalListFriends(false);
      setShowImageModal(false);
    };

    socket.on("updateChatRoom", handleUpdate);
    socket.on("updateChatRoom_rmMem", handleUpdate);
    socket.on("updateChatRoom_setAdmin", handleUpdate);
    socket.on("updateChatRoom_outGroup", handleOutGroup);
    socket.on("updateChatRoom_disbanded", handleDisband);
    return () => {
      socket.off("updateChatRoom", handleUpdate);
      socket.off("updateChatRoom_rmMem", handleUpdate);
      socket.off("updateChatRoom_setAdmin", handleUpdate);
      socket.off("updateChatRoom_outGroup", handleOutGroup);
      socket.off("updateChatRoom_disbanded", handleDisband);
    };
  }, [
    chatRoom,
    user.phoneNumber,
    t.updateGroupNotification,
    t.updateGroupNotification2,
    t.updateGroupNotification4,
    t.updateGroupNotificationRemoved,
  ]);

  const handleOpenInfoModal = () => {
    if (chatRoom.status === "DISBANDED") {
      toast.error(t.disbandedNotification);
      return;
    }
    setIsInfoModalOpen(true);
  };

  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const [replyingTo, setReplyingTo] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  const removeAccentsAndSpaces = (str) => {
    const accentsMap = [
      { base: "A", letters: "ÀÁÂÃÄÅĀĂĄ" },
      { base: "D", letters: "Đ" },
      { base: "E", letters: "ÈÉÊËĒĔĖĘĚ" },
      { base: "I", letters: "ÌÍÎÏĨĪĬĮ" },
      { base: "O", letters: "ÒÓÔÕÖŌŎŐ" },
      { base: "U", letters: "ÙÚÛÜŨŪŬŮŰŲ" },
      { base: "Y", letters: "ÝỲỸỶỴ" },
      { base: "a", letters: "àáâãäåāăą" },
      { base: "d", letters: "đ" },
      { base: "e", letters: "èéêëēĕėęě" },
      { base: "i", letters: "ìíîïĩīĭį" },
      { base: "o", letters: "òóôõöōŏő" },
      { base: "u", letters: "ùúûüũūŭůűų" },
      { base: "y", letters: "ýỳỹỷỵ" },
    ];

    let result = str;
    for (const { base, letters } of accentsMap) {
      for (const letter of letters) {
        result = result.replace(new RegExp(letter, "g"), base);
      }
    }
    return result.replace(/\s+/g, "");
  };

  const handleReplyMessage = (msg) => {
    setReplyingTo({
      ...msg,
      message:
        msg.type === "audio"
          ? "Tin nhắn thoại"
          : msg.type === "file"
          ? "File đính kèm"
          : msg.message,
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

  const handleAddReaction = async (messageId, reaction) => {
    if (chatRoom.status === "DISBANDED") {
      toast.error("Nhóm đã bị giải tán. Không thể thêm reaction.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3618/addReaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatRoomId: chatRoom.chatRoomId,
          messageId: messageId,
          user: currentUserPhone,
          reaction: reaction,
        }),
      });

      if (!response.ok) throw new Error("Không thể thêm reaction!");
      setShowReactions(null);
    } catch (error) {
      console.error("Lỗi khi thêm reaction:", error);
      toast.error("Không thể thêm reaction!");
    }
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
      toast.error(t.disbandedNotification);
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
          toast.info(t.messageFrom + senderName + " : " + data.message, {
            position: "bottom-right",
            autoClose: 5000,
          });
        } else if (data.type === "file") {
          toast.info(t.fileFrom + senderName, {
            position: "bottom-right",
            autoClose: 5000,
          });
        } else if (data.type === "audio") {
          toast.info(t.voiceFrom + senderName, {
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
  }, [user?.phoneNumber, t.fileFrom, t.voiceFrom, t.messageFrom]);

  // Lắng nghe sự kiện tag từ Socket.IO
  useEffect(() => {
    socket.on("tagged", (data) => {
      if (data.taggedUsers.includes(currentUserPhone)) {
        toast.info(
          `Bạn được tag trong tin nhắn từ ${
            userMap[data.sender]?.fullName || data.sender
          }`,
          {
            position: "bottom-right",
            autoClose: 5000,
            onClick: () => {
              const messageElement = document.getElementById(
                `message-${data.messageId}`
              );
              messageElement?.scrollIntoView({ behavior: "smooth" });
            },
          }
        );
        playNotificationSound();
      }
    });

    return () => {
      socket.off("tagged");
    };
  }, [currentUserPhone, userMap]);

  useEffect(() => {
    if (!chatRoom?.chatRoomId) return;
    const chatId =
      chatRoom.chatId || `${chatRoom.participants.sort().join("_")}`;
    socket.emit("joinRoom", chatId);
    socket.emit("joinRoom", chatRoom.chatRoomId);
    socket.emit("join", user.phoneNumber);

    const handleAvatarUpdate = (data) => {
      if (data.chatRoomId === chatRoom.chatRoomId || data.chatId === chatId) {
        setCurrentChatRoom((prev) => ({
          ...prev,
          avatar: data.newAvatarUrl,
        }));

        localStorage.setItem(
          `chatRoom_${data.chatId}_avatar`,
          data.newAvatarUrl
        );
        localStorage.setItem(
          `chatRoom_${data.chatRoomId}_avatar`,
          data.newAvatarUrl
        );

        const avatarElements = document.querySelectorAll(
          `img[src="${chatRoom.avatar}"]`
        );
        avatarElements.forEach((el) => {
          el.src = data.newAvatarUrl;
        });

        if (onUpdateChatRoom) {
          onUpdateChatRoom({
            ...chatRoom,
            avatar: data.newAvatarUrl,
          });
        }
      }
    };

    setCurrentUserPhone(user.phoneNumber);
    fetch(
      `http://localhost:3618/messages?chatRoomId=${chatRoom.chatRoomId}&currentUserPhone=${user.phoneNumber}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setMessages(Array.isArray(data) ? data : []);
        const reactionsData = {};
        data.forEach((msg) => {
          if (msg.reactions) {
            reactionsData[msg.timestamp] = msg.reactions;
          }
        });
        setMessageReactions(reactionsData);
        const revoked = data.filter((msg) => msg.isRevoked);
        if (revoked.length > 0) {
          setRevokedMessages(revoked.map((msg) => msg.timestamp));
        }
      })
      .catch((err) => {
        console.error("Lỗi khi lấy tin nhắn:", err);
        toast.error("Không thể lấy tin nhắn!");
        setMessages([]);
      });

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
        prev.map((msg) => (msg.timestamp === data.timestamp ? data : msg))
      );
      setRevokedMessages((prev) => [...prev, data.timestamp]);
      setMessageReactions((prev) => {
        const updatedReactions = { ...prev };
        delete updatedReactions[data.timestamp];
        return updatedReactions;
      });
      if (data.lastMessage) {
        updateLastMessage(data.sender, data.receiver, data.lastMessage);
      }
    });

    socket.on("messageReacted", (data) => {
      setMessageReactions((prev) => ({
        ...prev,
        [data.messageId]: data.reactions,
      }));
    });

    socket.on("groupAvatarUpdated", handleAvatarUpdate);

    return () => {
      socket.off("receiveMessage");
      socket.off("userTyping");
      socket.off("userStopTyping");
      socket.off("messageRevoked");
      socket.off("messageReacted");
      socket.off("groupAvatarUpdated", handleAvatarUpdate);
      socket.emit("leaveRoom", chatId);
      socket.emit("leaveRoom", chatRoom.chatRoomId);
    };
  }, [
    chatRoom?.chatRoomId,
    chatRoom?.chatId,
    user.phoneNumber,
    updateLastMessage,
    onUpdateChatRoom,
    chatRoom,
  ]);

  useEffect(() => {
    if (chatRoom?.chatId) {
      const cachedAvatar = localStorage.getItem(
        `chatRoom_${chatRoom.chatId}_avatar`
      );
      if (cachedAvatar) {
        setCurrentChatRoom((prev) => ({
          ...prev,
          avatar: cachedAvatar,
        }));
      }
    }
  }, [chatRoom?.chatId]);

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
    const value = event.target.value;
    setMessage(value);
    socket.emit("typing", chatRoom?.chatRoomId);
    setTimeout(() => socket.emit("stopTyping", chatRoom?.chatRoomId), 2000);

    const lastAt = value.lastIndexOf("@");
    if (
      lastAt !== -1 &&
      (value.length === lastAt + 1 || !value[lastAt + 1].match(/\s/))
    ) {
      const query = value
        .slice(lastAt + 1)
        .toLowerCase()
        .normalize("NFC");
      setTagQuery(query);
      setShowSuggestions(true);

      const suggestions = [];
      if (chatRoom.isGroup && "all".includes(query)) {
        suggestions.push({ fullName: "All", phoneNumber: "all" });
      }

      const filteredMembers = members.filter((member) =>
        removeAccentsAndSpaces(member.fullName.toLowerCase()).includes(
          removeAccentsAndSpaces(query)
        )
      );
      setSuggestionList([...suggestions, ...filteredMembers]);
    } else {
      setShowSuggestions(false);
      setSuggestionList([]);
    }
  };

  const handleSelectMember = (member) => {
    const lastAt = message.lastIndexOf("@");
    const beforeTag = message.slice(0, lastAt);
    const normalizedTagName = member.fullName.replace(/\s+/g, "");
    const newMessage = `${beforeTag}@${member.fullName} `;
    setMessage(newMessage);
    setShowSuggestions(false);
    setTagQuery("");
  };

  const renderSuggestions = () => {
    if (!showSuggestions || suggestionList.length === 0) return null;
    return (
      <div
        className="suggestions-dropdown"
        style={{
          position: "absolute",
          bottom: "60px",
          left: "150px",
          background: "#fff",
          color: "#000",
          border: "1px solid #ccc",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          zIndex: 1000,
          maxHeight: "180px",
        }}
      >
        {suggestionList.map((member) => (
          <div
            key={member.phoneNumber}
            className="suggestion-item"
            onClick={() => handleSelectMember(member)}
            style={{
              padding: "8px 12px",
              cursor: "pointer",
              fontWeight: member.phoneNumber === "all",
              borderBottom: "1px solid #eee",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#f0f0f0")}
            onMouseLeave={(e) => (e.target.style.background = "#fff")}
          >
            <img
              src={
                member.phoneNumber === "all"
                  ? chatRoom.avatar || a1
                  : member.avatar || a1
              }
              alt="avatar"
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                marginRight: 10,
                objectFit: "cover",
              }}
            />
            <span
              style={{
                fontWeight: member.phoneNumber === "all" ? "bold" : "normal",
                color: member.phoneNumber === "all" ? "#007bff" : "#000",
              }}
            ></span>
            {member.fullName}
          </div>
        ))}
      </div>
    );
  };

 const handleSendMessage = async () => {
  if (chatRoom.status === "DISBANDED") {
    toast.error(t.disbandedNotification);
    return;
  }
  if (!message.trim()) return;

  // Bỏ logic chuẩn hóa tag, giữ nguyên tin nhắn gốc
  const normalizedMessage = message.trim();

  // Xử lý taggedUsers (danh sách người được tag)
  const tagRegex = /@([\p{L}\s]+)(?=\s|$)/gu;
  const tags = normalizedMessage.match(tagRegex) || [];
  let taggedUsers = [];
  tags.forEach((tag) => {
    const name = tag.slice(1).trim();
    if (name.toLowerCase() === "all" && chatRoom.isGroup) {
      taggedUsers = [
        ...taggedUsers,
        ...chatRoom.participants.filter((phone) => phone !== currentUserPhone),
      ];
    } else {
      const member = members.find((m) => m.fullName === name);
      if (member) {
        taggedUsers.push(member.phoneNumber);
      }
    }
  });

  taggedUsers = [...new Set(taggedUsers)];

  const receivers =
    chatRoom?.participants?.filter((phone) => phone !== currentUserPhone) || [];
  const chatId = await getChatId(chatRoom.chatRoomId);
  const newMsg = {
    chatRoomId: chatRoom?.chatRoomId || "",
    sender: currentUserPhone,
    receiver: receivers,
    message: normalizedMessage,
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
    taggedUsers,
  };

  setMessage("");
  setReplyingTo(null);
  setShowSuggestions(false);

  try {
    const response = await fetch("http://localhost:3618/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMsg),
    });

    if (!response.ok) throw new Error("Gửi tin nhắn thất bại!");

    receivers.forEach((phone) => {
      updateLastMessage(currentUserPhone, phone, newMsg.message);
    });
  } catch (error) {
    console.error("Lỗi gửi tin nhắn:", error);
  }
};

  const handleCopyMessage = (message) => {
    if (message.isRevoked) return;
    if (message.type === "text") {
      navigator.clipboard
        .writeText(message.message)
        .then(() => {
          toast.success("Đã sao chép tin nhắn");
          setActiveMessageId(null);
        })
        .catch((err) => {
          console.error("Không thể sao chép tin nhắn:", err);
          toast.error("Không thể sao chép tin nhắn");
        });
    } else {
      toast.error("Chỉ có thể sao chép nội dung văn bản!");
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
      toast.error(t.disbandedNotification);
      return;
    }
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const receivers =
      chatRoom?.participants?.filter((phone) => phone !== currentUserPhone) ||
      [];
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
          `Tải file lên thất bại: ${
            errorData.error || `Mã lỗi: ${response.status}`
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
            alert("Không thể phát tin nhắn thoại: " + e.nativeEvent.error.message);
          }}
        />
      </div>
    );
  } else {
    // Tách tin nhắn thành các phần dựa trên ký tự @
    const parts = msg.message.split(/(@[\p{L}\s]+(?=\s|$))/gu);
    const renderedParts = parts.map((part, index) => {
      if (part.startsWith("@")) {
        // Đây là tag tên, hiển thị màu xanh dương và in đậm
        return (
          <span
            key={`tag-${index}`}
            style={{ color: "black" ,marginRight: "6px" }}
          >
            {part}
          </span>
        );
      } else {
        // Đây là phần text thông thường, hiển thị màu đen
        return (
          <span key={`text-${index}`} style={{ color: "black" }}>
            {part}
          </span>
        );
      }
    });

    return (
      <p
        style={{
          borderRadius: "25px",
          padding: "12px",
          width: "95%",
          wordWrap: "break-word",
        }}
      >
        {renderedParts}
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

  const renderReactions = (reactions, isRevoked) => {
    if (isRevoked || !reactions || Object.keys(reactions).length === 0)
      return null;

    return (
      <div className="message-reactions">
        {Object.entries(reactions).map(([reaction, users]) => (
          <div
            key={reaction}
            className={`reaction-badge ${
              activeReactionTooltip === `${reaction}-${users.join(",")}`
                ? "active"
                : ""
            }`}
            // onClick={() =>
            //   setActiveReactionTooltip(
            //     activeReactionTooltip === `${reaction}-${users.join(",")}`
            //       ? null
            //       : `${reaction}-${users.join(",")}`
            //   )
            // }
          >
            {reaction} {users.length}
            <div className="reaction-tooltip">
              <ul>
                {users.map((phone) => {
                  const user = userMap[phone] || {
                    fullName: phone,
                    avatar: a1,
                  };
                  return (
                    <li key={phone}>
                      <img src={user.avatar} alt={user.fullName} />
                      <span>{user.fullName}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    if (chatRoom?.chatRoomId) {
      const cachedAvatar = localStorage.getItem(
        `chatRoom_${chatRoom.chatRoomId}_avatar`
      );
      if (cachedAvatar) {
        setCurrentChatRoom((prev) => ({
          ...prev,
          avatar: cachedAvatar,
        }));
      }
    }
  }, [chatRoom?.chatRoomId]);

  useEffect(() => {
    setCurrentChatRoom(chatRoom);
  }, [chatRoom]);

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

  const handleOpenFriendsModal = async () => {
    if (chatRoom.isGroup) {
      openEditModal(chatRoom.chatRoomId);
    } else {
      openCreateModal();
    }
  };

  const openCreateModal = async () => {
    setNameGroup("");
    setListAddtoGroup([]);
    setIsEditMode(false);

    setModalListFriends(true);
    const data = await fetchFriends();
    setListFriends(data);
  };

  const openEditModal = async () => {
    if (chatRoom.status === "DISBANDED") {
      toast.error(t.disbandedNotification);
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

  const handleOpenNameModal = () => {
    if (chatRoom.status === "DISBANDED") {
      toast.error(t.disbandedNotification);
      return;
    }
    setNewGroupName(chatRoom.nameGroup || "");
    setShowNameModal(true);
  };

  const handleUpdateGroupName = async (e) => {
    e.preventDefault();

    if (
      !newGroupName.trim() ||
      !/^(?! )[A-Za-zÀ-ỹ0-9 ]{3,50}$/.test(newGroupName)
    ) {
      toast.error("Tên nhóm không hợp lệ.");
      return;
    }

    try {
      await updateChatRoom({
        roomId: chatRoom.chatRoomId,
        nameGroup: newGroupName,
        participants: chatRoom.participants,
        phone: user.phoneNumber,
      });

      setCurrentChatRoom({
        ...chatRoom,
        nameGroup: newGroupName,
      });

      toast.success(t.changeNameGroupSuccess);
      setShowNameModal(false);
    } catch (err) {
      console.error("Lỗi khi đổi tên nhóm:", err);
      toast.error(t.changeNameGroupError);
    }
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
          phone: user.phoneNumber,
        });
        toast.success(t.updateGroupNotification3);
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

  useEffect(() => {
    const fetchUsers = async () => {
      const map = {};
      for (const msg of messages) {
        if (!map[msg.sender]) {
          const result = await getUserbySearch(msg.sender, msg.sender);
          map[msg.sender] = result[0] || { fullName: msg.sender, avatar: a1 };
        }
        if (msg.reactions) {
          for (const users of Object.values(msg.reactions)) {
            for (const phone of users) {
              if (!map[phone]) {
                const result = await getUserbySearch(phone, phone);
                map[phone] = result[0] || { fullName: phone, avatar: a1 };
              }
            }
          }
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

  return (
    <>
      <div className="chat-box container">
        {!chatRoom || !userChatting || userChatting.length === 0 ? (
          <p className="text-center mt-3 centered-text">{t.notConversation2}</p>
        ) : (
          <>
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
                  {chatRoom.isGroup ? (
                    <>
                      {chatRoom.nameGroup ||
                        userChatting.map((u) => u.fullName).join(", ")}
                      {chatRoom.status !== "DISBANDED" && (
                        <button
                          className="btn btn-edit ms-2"
                          onClick={handleOpenNameModal}
                        >
                          <i className="bi bi-pencil-fill text-light"></i>
                        </button>
                      )}
                    </>
                  ) : (
                    userChatting?.[0]?.fullName || "Người lạ"
                  )}
                  {chatRoom.status === "DISBANDED" && (
                    <span className="badge bg-danger ms-2">{t.disbanded}</span>
                  )}
                </p>
              </div>
              <div className="col-sm-4 d-flex align-items-center justify-content-end">
                {chatRoom.isGroup && (
                  <>
                    <button className="btn" onClick={handleOpenFriendsModal}>
                      <i
                        className="bi bi-people-fill"
                        style={{ fontSize: 25, color: "#fff" }}
                      ></i>
                    </button>
                    <button className="btn" onClick={handleOpenInfoModal}>
                      <i
                        className="bi bi-three-dots-vertical"
                        style={{ fontSize: 25, color: "#fff" }}
                      ></i>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="chat-messages">
              {messages.map((msg, index) => {
                const isSentByCurrentUser = msg.sender === currentUserPhone;
                const isHighlighted = highlightedMessageId === msg.timestamp;
                const senderUser = userMap[msg.sender];

                return (
                  <div
                    key={index}
                    id={`message-${msg.timestamp}`}
                    className={`message ${
                      isSentByCurrentUser ? "sent" : "received"
                    } ${isHighlighted ? "highlighted" : ""}`}
                    onMouseEnter={() => setHoveredMessageId(msg.timestamp)}
                    onMouseLeave={() => {
                      setHoveredMessageId(null);
                      setShowReactions(null);
                    }}
                  >
                    {!isSentByCurrentUser && (
                      <img
                        src={senderUser?.avatar || a1}
                        alt="User Avatar"
                        className="user-avt"
                      />
                    )}

                    <div className="message-wrapper">
                      <div
                        className="message-info"
                        style={{ POSITION: "relative" }}
                      >
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
                              {msg.sender === currentUserPhone
                                ? msg.replyTo.sender === currentUserPhone
                                  ? "Bạn đã trả lời tin nhắn của mình"
                                  : `Bạn đã trả lời tin nhắn của ${
                                      userMap[msg.replyTo.sender]?.fullName ||
                                      "người khác"
                                    }`
                                : `${
                                    userMap[msg.sender]?.fullName ||
                                    "Người khác"
                                  } đã trả lời tin nhắn của ${
                                    userMap[msg.replyTo.sender]?.fullName ||
                                    "người khác"
                                  }`}
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
                                const repliedMessageElement =
                                  document.getElementById(
                                    `message-${msg.replyTo.timestamp}`
                                  );
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

                        {renderMessageContent(msg)}

                        <div
                          className="message-footer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                          }}
                        >
                          <span
                            className="timestamp"
                            style={{
                              color: "lightgrey",
                              fontSize: "12px",
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

                        {renderReactions(
                          messageReactions[msg.timestamp],
                          msg.isRevoked
                        )}

                        {showReactions === msg.timestamp && (
                          <div
                            className="reaction-picker"
                            onMouseEnter={() => setShowReactions(msg.timestamp)}
                            onMouseLeave={() => setShowReactions(null)}
                          >
                            {["👍", "❤️", "😂", "😮", "😢", "😡"].map(
                              (emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() =>
                                    handleAddReaction(msg.timestamp, emoji)
                                  }
                                  className="reaction-option"
                                >
                                  {emoji}
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="message-options-container">
                      {!msg.isRevoked && chatRoom.status !== "DISBANDED" && (
                        <>
                          <button
                            className="message-options-btn reaction-btn"
                            title="Thêm reaction"
                            onMouseEnter={() => setShowReactions(msg.timestamp)}
                          >
                            <i className="bi bi-emoji-smile"></i>
                          </button>
                          <button
                            className="message-options-btn reply-btn"
                            title="Trả lời"
                            onClick={() => handleReplyMessage(msg)}
                          >
                            <i className="bi bi-reply"></i>
                          </button>
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
                                onClick={() => handleCopyMessage(msg)}
                              >
                                <i className="bi bi-clipboard"></i> Sao chép tin
                                nhắn
                              </button>
                              {isSentByCurrentUser && (
                                <button
                                  className="message-option-item"
                                  onClick={() =>
                                    handleRevokeMessage(msg.timestamp)
                                  }
                                >
                                  <i className="bi bi-arrow-counterclockwise"></i>{" "}
                                  Thu hồi tin nhắn
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>

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

              {typing && <p className="typing-indicator">Đang nhập...</p>}
              {uploading && (
                <p className="typing-indicator">Đang tải file lên...</p>
              )}
              <div ref={messagesEndRef}></div>
            </div>

            <div className="chat-bottom row" style={{ position: "relative" }}>
              {renderSuggestions()}
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
                  placeholder={t.inputMessage}
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
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            role="document"
          >
            <div className="modal-content p-0">
              <div className="modal-header d-flex justify-content-between align-items-center">
                <h5 className="modal-title">{t.addMember}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModalListFriends(false)}
                ></button>
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <p className="fw-bold">
                    {t.currentMember} (
                    <span>
                      {chatRoom.participants.length} {t.mem}
                    </span>
                    )
                  </p>
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
                            src={member?.avatar}
                            alt="avatar"
                            className="rounded-circle me-2"
                            style={{
                              width: 40,
                              height: 40,
                              objectFit: "cover",
                            }}
                          />
                          <span>{member?.fullName || phone}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {listFriends.length === 0 ? (
                  <p className="text-muted">{t.noFriends}</p>
                ) : (
                  <div>
                    <p className="fw-bold">{t.mems}</p>
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
                              <span style={{ fontWeight: 500 }}>
                                {friend.fullName}
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              style={{ transform: "scale(1.2)" }}
                              value={friend.phoneNumber}
                              onChange={() =>
                                handleTogglePhoneNumber(friend.phoneNumber)
                              }
                              checked={listAddtoGroup.includes(
                                friend.phoneNumber
                              )}
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
                  {t.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNameModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content p-0">
              <div className="modal-header d-flex align-items-center">
                <h5 className="modal-title flex-grow-1">{t.changeNameGroup}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowNameModal(false)}
                ></button>
              </div>

              <form onSubmit={handleUpdateGroupName}>
                <div className="modal-body">
                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control"
                      id="groupName"
                      placeholder={t.inputNameGroup}
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      required
                      minLength="3"
                      maxLength="50"
                    />
                    <small className="form-text text-white">
                      {t.invalidNameGroup2}
                    </small>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowNameModal(false)}
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!newGroupName.trim()}
                  >
                    {t.save}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ShowModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        chatRoom={{ ...chatRoom, messages }}
        userChatting={userChatting}
        currentUserPhone={currentUserPhone}
        members={members}
        onUpdateChatRoom={onUpdateChatRoom}
        setIsInfoModalOpen={setIsInfoModalOpen}
      />
    </>
  );
}

export default Chat;
