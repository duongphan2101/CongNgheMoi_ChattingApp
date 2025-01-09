import React, { useState } from "react";
import "./chat_style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import a1 from "../../assets/imgs/9306614.jpg";
import a2 from "../../assets/imgs/9334176.jpg";
import a3 from "../../assets/imgs/1.jpg";

function Chat({ setCurrentView }) {
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false); // State for modal visibility
  const [showEditModal, setShowEditModal] = useState(false); // State for edit modal visibility
  const [userInfo, setUserInfo] = useState({
    name: "Trương Đại Lộc",
    gender: "Nam",
    dob: "12 tháng 11, 2003",
    phone: "+84 398 586 747",
  });
  const [editInfo, setEditInfo] = useState(userInfo);

  const [messages, setMessages] = useState([
    { text: "Hi, how are you?", time: "11:40 AM", sender: "sent" },
    {
      text: "Hi, I am good. Thank you, how about you?",
      time: "11:41 AM",
      sender: "received",
    },
    {
      text: "I am good too, thank you for your chat template.",
      time: "11:44 AM",
      sender: "sent",
    },
  ]);

  const handleInputChange = (event) => {
    setMessage(event.target.value);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([
        ...messages,
        {
          text: message,
          time: new Date().toLocaleTimeString(),
          sender: "sent",
        },
      ]);
      setMessage("");
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditInfo({ ...editInfo, [name]: value });
  };

  const handleSaveChanges = () => {
    setUserInfo(editInfo);
    setShowEditModal(false);
  };

  return (
    <div className="container chat-container">
      {/* Intro Animation */}
      <div className="intro-animation">
        <p>Welcome!</p>
        <p style={{ fontSize: "34px", fontWeight: "bold" }}>VChat</p>
      </div>

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-header_search">
            <input type="text" placeholder="Search..." />
            <button className="btn">
              <i className="bi bi-search text-light"></i>
            </button>
          </div>
        </div>

        {/* User List */}
        <div className="user-list">
          <div className="user active">
            <img className="user-avt" src={a1} alt="User" />
            <div>
              <strong>Khalid</strong>
              <br />
              <small>Khalid is online</small>
            </div>
          </div>

          <div className="user">
            <img className="user-avt" src={a2} alt="User" />
            <div>
              <strong>Taherah Big</strong>
              <br />
              <small>Last seen 7 mins ago</small>
            </div>
          </div>

          <div className="user">
            <img className="user-avt" src={a3} alt="User" />
            <div>
              <strong>Sami Rafi</strong>
              <br />
              <small>Sami is online</small>
            </div>
          </div>
        </div>

        <div className="sidebar-bottom d-flex justify-content-around align-items-center">
          <button
            className="sidebar-bottom-btn btn"
            onClick={() => setShowModal(true)} // Show modal on click
          >
            <i className="sidebar-bottom_icon bi bi-person-circle text-light"></i>
          </button>
          <button
            className="sidebar-bottom-btn btn active"
            onClick={() => setCurrentView("chat")}
          >
            <i className="sidebar-bottom_icon bi bi-chat-dots text-light"></i>
          </button>
          <button className="sidebar-bottom-btn btn">
            <i className="sidebar-bottom_icon bi bi-person-rolodex text-light"></i>
          </button>
          <button
            className="sidebar-bottom-btn btn"
            onClick={() => setCurrentView("cloud")}
          >
            <i className="sidebar-bottom_icon bi bi-cloud text-light"></i>
          </button>
          <button
            className="sidebar-bottom-btn btn"
            onClick={() => setCurrentView("setting")}
          >
            <i className="sidebar-bottom_icon bi bi-gear text-light"></i>
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header d-flex align-items-center">
                <h5 className="modal-title flex-grow-1">Thông tin tài khoản</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body text-center">
                <div className="d-flex justify-content-center position-relative">
                  <img
                    className="user-avt"
                    src={a3}
                    alt="User Avatar"
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover",
                      border: "2px solid white",
                    }}
                  />
                </div>
                <h5 className="fw-bold mt-3 mb-4">{userInfo.name}</h5>
                <div className="text-start px-3">
                  <h6>
                    <strong>Thông tin cá nhân</strong>
                  </h6>
                  <p>
                    Giới tính <strong>{userInfo.gender}</strong>
                  </p>
                  <p>
                    Ngày sinh <strong>{userInfo.dob}</strong>
                  </p>
                  <p>
                    Điện thoại <strong>{userInfo.phone}</strong>
                  </p>
                  <small className="text-muted">
                    Chỉ bạn bè có lưu số của bạn trong danh bạ máy xem được số
                    này
                  </small>
                </div>
              </div>
              <div className="modal-footer bg-dark">
                <button
                  type="button"
                  className="btn w-100 py-3 custom-button"
                  onClick={() => {
                    setShowModal(false);
                    setShowEditModal(true);
                  }}
                >
                  <i className="bi bi-pencil me-2"></i> Cập nhật
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Cập nhật thông tin cá nhân</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label className="form-label">Tên hiển thị</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={editInfo.name}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Giới tính</label>
                    <div>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="gender"
                          id="genderMale"
                          value="Nam"
                          checked={editInfo.gender === "Nam"}
                          onChange={handleEditChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="genderMale"
                        >
                          Nam
                        </label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="gender"
                          id="genderFemale"
                          value="Nữ"
                          checked={editInfo.gender === "Nữ"}
                          onChange={handleEditChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="genderFemale"
                        >
                          Nữ
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Ngày sinh</label>
                    <div className="d-flex">
                      <select
                        className="form-select me-2"
                        name="day"
                        value={editInfo.day}
                        onChange={handleEditChange}
                      >
                        <option value="" disabled>
                          Ngày
                        </option>
                        {Array.from({ length: 31 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                      <select
                        className="form-select me-2"
                        name="month"
                        value={editInfo.month}
                        onChange={handleEditChange}
                      >
                        <option value="" disabled>
                          Tháng
                        </option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            Tháng {i + 1}
                          </option>
                        ))}
                      </select>
                      <select
                        className="form-select"
                        name="year"
                        value={editInfo.year}
                        onChange={handleEditChange}
                      >
                        <option value="" disabled>
                          Năm
                        </option>
                        {Array.from({ length: 100 }, (_, i) => {
                          const year = new Date().getFullYear() - i;
                          return (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </form>
              </div>

              <div className="edit-modal-footer">
  <button
    type="button"
    className="btn btn-secondary me-2 btn-hover"
    style={{
      color: "#ffffff", // Màu chữ trắng
      backgroundColor: "#6c757d", // Màu nền xám
      borderColor: "#6c757d", // Màu viền xám
    }}
    onClick={() => {
      setShowEditModal(false);
      setShowModal(true); // Quay lại modal trước
    }}
  >
    Hủy
  </button>
  <button
    type="button"
    className="btn btn-primary btn-hover"
    style={{
      color: "#ffffff", // Màu chữ trắng
      backgroundColor: "#007bff", // Màu nền xanh dương
      borderColor: "#007bff", // Màu viền xanh
    }}
    onClick={handleSaveChanges}
  >
    Cập nhật
  </button>
</div>

            </div>
          </div>
        </div>
      )}

      {/* Chat Box */}
      <div className="chat-box container">
        <div className="chat-header row">
          <div className="col-sm-3 d-flex align-items-center">
            <img className="chat-header_avt" src={a1} alt="" />
            <p className="chat-header_name px-2 m-0">Khalid</p>
          </div>
          <div className="col-sm-6">
            <button className="btn">
              <i className="chat-header_icon mx-2 bi bi-camera-video"></i>
            </button>
            <button className="btn">
              <i className="chat-header_icon mx-2 bi bi-telephone"></i>
            </button>
          </div>
          <div className="col-sm-3 d-flex justify-content-end">
            <button className="btn">
              <i className="chat-header_icon bi bi-three-dots-vertical"></i>
            </button>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <div className="message-info">
                <span>{msg.time}</span>
                <p>{msg.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="chat-bottom row">
          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <button className="btn">
              <i className="bi bi-emoji-smile text-light"></i>
            </button>
            <button className="btn">
              <i className="bi bi-file-earmark-arrow-up text-light"></i>
            </button>
            <input
              type="text"
              placeholder="Type your message..."
              value={message}
              onChange={handleInputChange}
            />
            <button className="btn btn-link" type="submit">
              <i className="bi bi-send-fill"></i>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Chat;
