import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./ShowModal.css";

const ShowModal = ({ isOpen, onClose, chatRoom, userChatting, currentUserPhone, userMap }) => {
  if (!isOpen) return null;

  // Lấy thông tin người dùng trong cuộc trò chuyện
  const displayName = chatRoom.isGroup
    ? chatRoom.nameGroup || userChatting.map((u) => u.fullName).join(", ")
    : userChatting?.[0]?.fullName || "Người lạ";

  // Tạo tên viết tắt để hiển thị trong avatar
  const initials = displayName
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 8);

  return (
    <div className="modal modal-container">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content modal-content-custom">
          {/* Header */}
          <div className="modal-header d-flex justify-content-between align-items-center modal-header-custom">
            <h5 className="modal-title">Thông tin hội thoại</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body">
            {/* Contact Info */}
            <div className="contact-info">
              <div className="avatar-circle">
                {initials}
              </div>
              <div className="contact-name">
                <h6>{displayName}</h6>
              </div>
              <button className="btn btn-link edit-button">
                ✎
              </button>
            </div>

            {/* Contact List */}
            <div className="section-header">
              <label className="section-label">Danh sách thành viên</label>
              <button className="btn btn-link view-all-button">
                ⌄
              </button>
            </div>

            {/* Media */}
            <div className="section-header">
              <div className="d-flex justify-content-between align-items-center">
                <label className="section-label">Ảnh/Video</label>
                <button className="btn btn-link view-all-button">
                  Xem tất cả
                </button>
              </div>
           
            </div>

            {/* Files */}
            <div className="section-header">
              <div className="d-flex justify-content-between align-items-center">
                <label className="section-label">File</label>
                <button className="btn btn-link view-all-buttonfile">
                  Xem tất cả
                </button>
              </div>
            
            </div>

            {/* Links */}
            <div className="section-header">
              <div className="d-flex justify-content-between align-items-center">
                <label className="section-label">Link</label>
                <button className="btn btn-link view-all-buttonlink">
                  Xem tất cả
                </button>
              </div>
            </div>

         
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowModal;