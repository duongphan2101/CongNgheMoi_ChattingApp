import React, { useState } from "react";
import "./ShowModal.css";
import { toast } from "react-toastify";
import deleteMember from "../../API/api_deleteMember.js";
import getChatRoom from "../../API/api_getMessagebyChatRoomId.js";
import getUserbySearch from "../../API/api_searchUSer";

const ShowModal = ({
  isOpen,
  onClose,
  chatRoom,
  userChatting,
  currentUserPhone,
  userMap,
  onDisbandGroup,
  onRemoveMember,
  defaultAvatar,
}) => {
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isImageZoomModalOpen, setIsImageZoomModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  if (!isOpen) return null;

  const displayName = chatRoom.isGroup
    ? chatRoom.nameGroup || userChatting.map((u) => u.fullName).join(", ")
    : userChatting?.[0]?.fullName || "Người lạ";

  const handleDisbandGroup = () => {
    if (onDisbandGroup) {
      const confirm = window.confirm("Bạn có chắc muốn giải tán nhóm này không?");
      if (confirm) {
        onDisbandGroup(chatRoom.chatRoomId);
      }
    }
  };



  const mediaMessages = chatRoom.messages
    ? chatRoom.messages.filter((msg) => {
        if (msg.type === "file") {
          try {
            const fileInfo = JSON.parse(msg.message);
            return fileInfo.type.startsWith("image/");
          } catch (error) {
            console.error("Lỗi phân tích thông tin file:", error);
            return false;
          }
        }
        return false;
      })
    : [];

  const fileMessages = chatRoom.messages
    ? chatRoom.messages.filter((msg) => {
        if (msg.type === "file") {
          try {
            const fileInfo = JSON.parse(msg.message);
            return !fileInfo.type.startsWith("image/");
          } catch (error) {
            console.error("Lỗi phân tích thông tin file:", error);
            return false;
          }
        }
        return false;
      })
    : [];

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const downloadFile = (msg) => {
    const fileInfo = JSON.parse(msg.message);
    const downloadUrl = `http://localhost:3618/download/${chatRoom.chatRoomId}/${msg.timestamp}`;

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileInfo.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayedMedia = mediaMessages.slice(0, 3);

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsImageZoomModalOpen(true);
  };

  return (
    <>
      <div className="showmodal-container">
        <div className="showmodal-dialog">
          <div className="showmodal-content">
            <div className="showmodal-header">
              <h5 className="modal-title">Thông tin hội thoại</h5>
              <button type="button" className="showmodal-btn-close" onClick={onClose}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="showmodal-body">
              <div className="showmodal-contact-info">
                <img
                  src={
                    chatRoom.isGroup
                      ? chatRoom.avatar || defaultAvatar
                      : userChatting?.[0]?.avatar || defaultAvatar
                  }
                  alt={displayName}
                  className="showmodal-avatar"
                />
                <h6 className="showmodal-contact-name">{displayName}</h6>
              
              </div>

              <div className="showmodal-section-header">
                <div className="showmodal-section-title">
                  <span className="showmodal-section-icon">
                    <i className="bi bi-people-fill"></i>
                  </span>
                  <span className="showmodal-section-label">Danh sách thành viên</span>
                </div>
              </div>

              {chatRoom.isGroup && (
                <div className="showmodal-members-list">
                  <ul className="showmodal-list">
                    {userChatting.map((member) => (
                      <li
                        key={member.phoneNumber}
                        className="showmodal-list-item"
                      >
                        <div className="showmodal-member-info">
                          <img
                            src={member.avatar || defaultAvatar}
                            alt={member.fullName}
                            className="showmodal-member-avatar"
                          />
                          <span>{member.fullName || member.phoneNumber}</span>
                          {member.phoneNumber === chatRoom.admin && (
                            <span className="showmodal-badge-admin">Admin</span>
                          )}
                        </div>
                       
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="showmodal-section-header">
                <div className="showmodal-section-title">
                  <span className="showmodal-section-label">Ảnh</span>
                </div>
                {mediaMessages.length > 0 && (
                  <button
                    className="showmodal-view-all-btn"
                    onClick={() => setIsMediaModalOpen(true)}
                  >
                    Xem tất cả
                  </button>
                )}
              </div>
              <div className="showmodal-media-gallery">
                {mediaMessages.length > 0 ? (
                  displayedMedia.map((msg, index) => (
                    <div key={index} className="showmodal-media-item">
                      <img
                        src={`http://localhost:3618/view/${chatRoom.chatRoomId}/${msg.timestamp}`}
                        alt={`Media ${index}`}
                        className="showmodal-media"
                        onError={(e) => (e.target.src = defaultAvatar)}
                        onClick={() =>
                          handleImageClick(
                            `http://localhost:3618/view/${chatRoom.chatRoomId}/${msg.timestamp}`
                          )
                        }
                      />
                    </div>
                  ))
                ) : (
                  <>
                    <div className="showmodal-media-placeholder"></div>
                    <div className="showmodal-media-placeholder"></div>
                    <div className="showmodal-media-placeholder"></div>
                    <div className="showmodal-media-placeholder"></div>
                  </>
                )}
              </div>

              <div className="showmodal-section-header">
                <div className="showmodal-section-title">
                  <span className="showmodal-section-label">File</span>
                </div>
              </div>
              <div className="showmodal-files-list">
                {fileMessages.length > 0 ? (
                  <ul className="showmodal-list">
                    {fileMessages.map((msg, index) => {
                      const fileInfo = JSON.parse(msg.message);
                      return (
                        <li
                          key={index}
                          className="showmodal-list-item"
                        >
                          <div className="showmodal-file-info">
                            <i className="bi bi-file-earmark"></i>
                            <span>{fileInfo.name}</span>
                            <span className="showmodal-file-size">
                              ({formatFileSize(fileInfo.size)})
                            </span>
                          </div>
                          <button
                            className="showmodal-btn-download"
                            onClick={() => downloadFile(msg)}
                          >
                            <i className="bi bi-download"></i>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="showmodal-text-muted">Không có file nào</p>
                )}
              </div>

              {chatRoom.isGroup && currentUserPhone === chatRoom.admin && (
                <div className="showmodal-footer">
                  <button className="showmodal-btn-disband" onClick={handleDisbandGroup}>
                    Giải tán nhóm
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isMediaModalOpen && (
        <div className="showmodal-container">
          <div className="showmodal-media-modal">
            <div className="showmodal-content">
              <div className="showmodal-header">
                <h5 className="modal-title">Tất cả ảnh</h5>
                <button
                  type="button"
                  className="showmodal-btn-close"
                  onClick={() => setIsMediaModalOpen(false)}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div className="showmodal-body">
                <div className="showmodal-media-gallery">
                  {mediaMessages.map((msg, index) => (
                    <div key={index} className="showmodal-media-item">
                      <img
                        src={`http://localhost:3618/view/${chatRoom.chatRoomId}/${msg.timestamp}`}
                        alt={`Media ${index}`}
                        className="showmodal-media"
                        onError={(e) => (e.target.src = defaultAvatar)}
                        onClick={() =>
                          handleImageClick(
                            `http://localhost:3618/view/${chatRoom.chatRoomId}/${msg.timestamp}`
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isImageZoomModalOpen && (
        <div className="showmodal-container">
          <div className="showmodal-zoom-modal">
            <div className="showmodal-content">
              <div className="showmodal-header">
                <h5 className="modal-title">Xem ảnh</h5>
                <button
                  type="button"
                  className="showmodal-btn-close"
                  onClick={() => setIsImageZoomModalOpen(false)}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div className="showmodal-zoom-body">
                <img
                  src={selectedImage}
                  alt="Ảnh trong cuộc trò chuyện"
                  className="showmodal-zoom-image"
                  onError={(e) => (e.target.src = defaultAvatar)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShowModal;