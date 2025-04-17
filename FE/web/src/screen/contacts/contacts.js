import React, { useState, useEffect } from "react";
import "./contacts_style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

const BASE_URL = "localhost";

function Contacts({
  friendRequests,
  friends,
  handleAcceptFriendRequest,
  handleRejectFriendRequest,
  setFriends,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const contacts = [];

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log("Friends in Contacts:", friends);

  const handleUnfriend = async (friendPhone) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert("Vui lòng đăng nhập!");
        return;
      }

      console.log("Đang gửi yêu cầu hủy kết bạn với:", friendPhone);
      console.log("Token:", token);

      const response = await axios.post(
        `http://${BASE_URL}:3824/user/unfriend`,
        { friendPhone },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log("Response từ server:", response.data);

      if (response.data.message === "Đã hủy kết bạn thành công!") {
        // Cập nhật UI bằng cách reload trang
        window.location.reload();
        alert("Đã hủy kết bạn!");
      }
    } catch (error) {
      console.error("Lỗi hủy kết bạn:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
      }
      alert("Không thể hủy kết bạn! Vui lòng thử lại sau.");
    }
  };

  return (
    <div className="chat-box container">
      <div className="chat-header row">
        <div className="col-sm-3 d-flex align-items-center">
          <i className="sidebar-bottom_icon bi bi-person-rolodex text-light"></i>
          <p className="chat-header_name px-2 m-0">Contacts</p>
        </div>
        <div className="col-sm-6">
          <div className="search-container w-100">
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div className="col-sm-3"></div>
      </div>

      {/* Hiển thị danh sách lời mời kết bạn */}
      <div className="friend-requests mt-4">
        <h5 className="text-light">Lời mời kết bạn</h5>
        {friendRequests && friendRequests.length > 0 ? (
          <ul className="list-group">
            {friendRequests.map((request) => (
              <li
                key={request.RequestId} // Đảm bảo RequestId là duy nhất
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <span>{request.senderPhone}</span>
                <div>
                  <button
                    className="btn btn-success btn-sm me-2"
                    onClick={() => handleAcceptFriendRequest(request.RequestId)}
                  >
                    Chấp nhận
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRejectFriendRequest(request.RequestId)}
                  >
                    Từ chối
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-light">Không có lời mời kết bạn nào.</p>
        )}
      </div>

      {/* Hiển thị danh sách bạn bè */}
      <div className="friends-list mt-4">
        <h5 className="text-light">Danh sách bạn bè</h5>
        {friends.length > 0 ? (
          friends.map((friend) => (
            <div key={friend.phoneNumber} className="contact-item">
              <div className="d-flex align-items-center">
                <div className="contact-avatar">
                  <img
                    src={friend.avatar || "default-avatar.png"}
                    alt={friend.fullName || "Unknown"}
                    className="user-avt"
                  />
                </div>
                <div className="contact-info">
                  <h5 className="mb-0">{friend.fullName || "Không rõ"}</h5>
                  <small>{friend.phoneNumber}</small>
                </div>
              </div>
              <button 
                className="unfriend-button"
                onClick={() => handleUnfriend(friend.phoneNumber)}
              >
                Hủy kết bạn
              </button>
            </div>
          ))
        ) : (
          <p className="text-light">Không có bạn bè nào.</p>
        )}
      </div>

      {/* Hiển thị danh sách liên hệ */}
      <div className="contacts-list mt-4">
        {filteredContacts.map((contact, index) => (
          <div key={index} className="contact-item"> {/* Sử dụng index làm key */}
            <div className="d-flex align-items-center">
              <div className="contact-avatar">
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="user-avt"
                />
                <span
                  className={`status-indicator ${
                    contact.online ? "online" : "offline"
                  }`}
                ></span>
              </div>
              <div className="contact-info">
                <h5 className="mb-0">{contact.name}</h5>
                <small>{contact.online ? "Online" : "Offline"}</small>
              </div>
            </div>
            <div className="contact-actions">
              <button className="btn action-btn">
                <i className="bi bi-chat-dots"></i>
              </button>
              <button className="btn action-btn">
                <i className="bi bi-three-dots-vertical"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Contacts;
