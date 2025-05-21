import React, { useState, useContext } from "react";
import "./contacts_style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { LanguageContext, locales } from "../../contexts/LanguageContext";
import { toast } from "react-toastify";

const BASE_URL = "localhost";

function Contacts({
  friendRequests,
  friends,
  handleAcceptFriendRequest,
  handleRejectFriendRequest,
  setFriends,
  fetchFriends,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const { language } = useContext(LanguageContext);
  const t = locales[language];
  const contacts = [];

  const filteredFriends = friends.filter((friend) =>
    (friend.fullName || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUnfriend = async (friendPhone) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Vui lòng đăng nhập!");
        return;
      }

      const response = await axios.post(
        `http://${BASE_URL}:3824/user/unfriend`,
        { friendPhone },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.message === "Đã hủy kết bạn thành công!") {
        // Cập nhật danh sách bạn bè
        const updatedFriends = friends.filter(
          (friend) => friend.phoneNumber !== friendPhone
        );
        setFriends([...updatedFriends]); // Đảm bảo tạo một mảng mới

        // Gọi lại fetchFriends để đồng bộ hóa
        if (updatedFriends.length === 0) {
          await fetchFriends(); // Đồng bộ lại từ server nếu danh sách rỗng
        }

        toast.success(t.unfriendSuccess);
      }
    } catch (error) {
      console.error("Lỗi hủy kết bạn:", error);
      toast.error(t.unfriendFailed);
    }
  };

  return (
    <div className="chat-box container">
      <div className="chat-header row">
        <div className="col-sm-3 d-flex align-items-center">
          <i className="sidebar-bottom_icon bi bi-person-rolodex text-light"></i>
          <p className="chat-header_name px-2 m-0">{t.contacts}</p>
        </div>
        <div className="col-sm-6">
          <div className="search-container w-100">
            <input
              type="text"
              placeholder={t.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div className="col-sm-3"></div>
      </div>

      {/* Hiển thị danh sách lời mời kết bạn */}
      <div className="friend-requests">
        <h5>{t.friendRequest}</h5>
        {friendRequests && friendRequests.length > 0 ? (
          <ul className="list-group">
            {friendRequests.map((request) => (
              <li
                key={request.RequestId} // Đảm bảo RequestId là duy nhất
                className="list-group-item"
              >
                <span>{request.senderPhone}</span>
                <div>
                  <button
                    className="btn btn-success me-2"
                    onClick={() => handleAcceptFriendRequest(request.RequestId)}
                  >
                    {t.acceptFriendRequest}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleRejectFriendRequest(request.RequestId)}
                  >
                    {t.cancel}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-light">{t.notFriendRequest}</p>
        )}
      </div>

      {/* Hiển thị danh sách bạn bè */}
      <div className="friends-list mt-4">
        <h5 className="text-light">{t.listFriend}</h5>
        {filteredFriends.length > 0 ? (
          filteredFriends.map((friend) => (
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
                {t.unfriend}
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
          <div key={index} className="contact-item">
            {" "}
            {/* Sử dụng index làm key */}
            <div className="d-flex align-items-center">
              <div className="contact-avatar">
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="user-avt"
                />
                <span
                  className={`status-indicator ${contact.online ? "online" : "offline"
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
