import React, { useState, useContext } from "react";
import "./ShowModal.css";
import { toast } from "react-toastify";
import deleteMember from "../../API/api_deleteMember.js";
import updateGroupAvatar from "../../API/api_updateGroupAvatar";
import disbandGroup from "../../API/api_disbandGroup.js";
import Swal from 'sweetalert2';
import setAdmin from "../../API/api_setAdmin.js";
import outGroup from "../../API/api_outGroup.js";
import { LanguageContext, locales } from "../../contexts/LanguageContext";
const ShowModal = ({
  isOpen,
  onClose,
  chatRoom,
  userChatting,
  currentUserPhone,
  members,
  defaultAvatar,
  onUpdateChatRoom,
  setIsInfoModalOpen
}) => {
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isImageZoomModalOpen, setIsImageZoomModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentChatRoom, setCurrentChatRoom] = useState(chatRoom);

  const { language } = useContext(LanguageContext);
  const t = locales[language];

  if (!isOpen) return null;

  const displayName = chatRoom.isGroup
    ? chatRoom.nameGroup || userChatting.map((u) => u.fullName).join(", ")
    : userChatting?.[0]?.fullName || "Người lạ";



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

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await updateGroupAvatar(chatRoom.chatRoomId, file);

      setCurrentChatRoom(prev => ({
        ...prev,
        avatar: result.avatarUrl
      }));

      if (onUpdateChatRoom) {
        onUpdateChatRoom({
          ...chatRoom,
          avatar: result.avatarUrl
        });
      }

      const avatarElements = document.querySelectorAll(`img[src="${chatRoom.avatar}"]`);
      avatarElements.forEach(el => {
        el.src = result.avatarUrl;
      });

      localStorage.setItem(`chatRoom_${result.chatId}_avatar`, result.avatarUrl);

      toast.success(t.updateAvatarSuccess);
    } catch (error) {
      console.error("Lỗi khi cập nhật avatar:", error);
      toast.error(t.updateAvatarError);
    }
  };

  const handleRemoveMember = async (phoneNumberToRemove, fullName) => {
    const result = await Swal.fire({
      title: t.removeMemberNotification + fullName + t.removeMemberNotification2,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t.oke,
      cancelButtonText: t.cancel,
      background: '#222',
    });

    if (result.isConfirmed) {
      try {
        const res = await deleteMember(
          chatRoom.chatRoomId,
          phoneNumberToRemove
        );
        toast.success(t.removeMemberSuccess);
        setIsInfoModalOpen(false);
      } catch (err) {
        console.error("Lỗi khi xóa thành viên:", err.message);
        toast.error(t.removeMemberError);
      }
    }
  };

  const handleDisbandGroup = async (chatRoomId) => {
    const confirmResult = await Swal.fire({
      title: t.disbandGroupNotification,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t.oke,
      cancelButtonText: t.cancel,
      background: '#222',
    });

    if (!confirmResult.isConfirmed) return;

    try {
      const response = await disbandGroup(chatRoomId);
      toast.success(t.disbandGroupSuccess);
      setIsInfoModalOpen(false);
    } catch (error) {
      console.error("Lỗi khi giải tán nhóm:", error.message);
      toast.error(t.disbandGroupError);
    }
  };

  const handleSetAdmin = async (phoneNumber, fullName) => {
    const result = await Swal.fire({
      title: t.setAdminNotification + fullName + t.setAdminNotification2,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t.oke,
      cancelButtonText: t.cancel,
      background: '#222',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await setAdmin(chatRoom.chatRoomId, phoneNumber);
      toast.success(t.setAdminSuccess);
      setIsInfoModalOpen(false);
    } catch (error) {
      console.error("Lỗi khi chỉ định admin:", error.message);
      toast.error(t.setAdminError);
    }
  };

  const handleOutGroup = async (phoneNumber) => {
    const result = await Swal.fire({
      title: t.outGroupNotification,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t.oke,
      cancelButtonText: t.cancel,
      background: '#222',
    });
    if (!result.isConfirmed) return;

    try {
      const res = await outGroup(chatRoom.chatRoomId, phoneNumber);
      toast.success(res.message);
      setIsInfoModalOpen(false);
    } catch (error) {
      console.error("Lỗi khi rời nhóm:", error.message);
      toast.error("Đã xảy ra lỗi khi rời nhóm.");
    }
  };

  return (
    <>
      <div className="showmodal-container">
        <div className="showmodal-dialog">
          <div className="showmodal-content">
            <div className="showmodal-header">
              <h5 className="modal-title">{t.groupInfor}</h5>
              <button type="button" className="showmodal-btn-close" onClick={onClose}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="showmodal-body">
              <div className="showmodal-contact-info">
                <img
                  className="modal_avt me-2"
                  src={chatRoom.avatar}
                  alt="avatar"
                  style={{ borderRadius: "50%" }}
                />
                <div className="showmodal-contact-changeAvt">
                  <label className="btn" htmlFor="avatarInput">
                    <i className="bi bi-pencil-fill text-light"></i>
                  </label>
                  <input
                    type="file"
                    id="avatarInput"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>
              <h6 className="showmodal-contact-name">{displayName}</h6>
              <div className="showmodal-section-header">
                <div className="showmodal-section-title">
                  <span className="showmodal-section-icon">
                    <i className="bi bi-people-fill"></i>
                  </span>
                  <span className="showmodal-section-label">{t.MemberList}</span>
                </div>
              </div>

              {chatRoom.isGroup && (
                <div className="showmodal-members-list">
                  <ul className="showmodal-list">
                    {members.map((member) => (
                      <li
                        key={member.phoneNumber}
                        className="showmodal-list-item"
                      >
                        <div className="showmodal-member-info">
                          <div className="d-flex">
                            <img
                              src={member.avatar || defaultAvatar}
                              alt={member.fullName}
                              className="showmodal-member-avatar"
                            />
                            <span>{member.fullName}</span>
                          </div>

                          <div>
                            {member.phoneNumber === chatRoom.admin && (
                              <span className="showmodal-badge-admin">Admin</span>
                            )}
                            {chatRoom.admin === currentUserPhone && member.phoneNumber !== currentUserPhone && (
                              <>
                                <button className="btn btn-warning mx-2" onClick={() => handleSetAdmin(member.phoneNumber, member.fullName)}>
                                  <i className="bi bi-arrow-up-right-circle-fill text-light"></i>
                                </button>
                                <button className="btn btn-danger" onClick={() => handleRemoveMember(member.phoneNumber, member.fullName)}>
                                  <i className="bi bi-trash3-fill" />
                                </button>
                              </>
                            )}
                          </div>

                        </div>

                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="showmodal-section-header">
                <div className="showmodal-section-title">
                  <span className="showmodal-section-label">{t.image}</span>
                </div>
                {mediaMessages.length > 0 && (
                  <button
                    className="showmodal-view-all-btn"
                    onClick={() => setIsMediaModalOpen(true)}
                  >
                    {t.showAll}
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
                  <p className="showmodal-text-muted">{t.notFile}</p>
                )}
              </div>

              {chatRoom.isGroup && currentUserPhone === chatRoom.admin && (
                <div className="showmodal-footer">
                  <button className="showmodal-btn-disband" onClick={() => handleDisbandGroup(chatRoom.chatRoomId)}>
                    {t.disbandGroup}
                  </button>
                </div>
              )}
              {chatRoom.isGroup && currentUserPhone !== chatRoom.admin && (
                <div className="showmodal-footer">
                  <button className="showmodal-btn-disband" onClick={() => handleOutGroup(currentUserPhone)}>
                    {t.outGroup}
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