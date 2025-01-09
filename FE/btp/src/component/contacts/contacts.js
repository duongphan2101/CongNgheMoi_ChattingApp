import React, { useState } from "react";
import "./contacts_style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import a1 from "../../assets/imgs/9306614.jpg";
import a2 from "../../assets/imgs/9334176.jpg";
import a3 from "../../assets/imgs/1.jpg";

function Contacts({ setCurrentView }) {
    const [searchTerm, setSearchTerm] = useState("");

    const contacts = [
        { id: 1, name: "J97", online: true, avatar: a1 },
        { id: 2, name: "Trịnh Trần Phương Tuấn", online: false, avatar: a2 },
        { id: 3, name: "Jack", online: true, avatar: a3 },
        { id: 4, name: "Tinh Tú", online: true, avatar: a1 },
    ];    

    const filteredContacts = contacts.filter((contact) =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [showModal, setShowModal] = useState(false); // State for modal visibility
    const [showEditModal, setShowEditModal] = useState(false); // State for edit modal visibility
    const [userInfo, setUserInfo] = useState({
      name: "Trương Đại Lộc",
      gender: "Nam",
      dob: "12 tháng 11, 2003",
      phone: "+84 398 586 747",
    });
    const [editInfo, setEditInfo] = useState(userInfo);


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
                            <strong>Khalid</strong><br />
                            <small>Khalid is online</small>
                        </div>
                    </div>

                    <div className="user">
                        <img className="user-avt" src={a2} alt="User" />
                        <div>
                            <strong>Taherah Big</strong><br />
                            <small>Last seen 7 mins ago</small>
                        </div>
                    </div>

                    <div className="user">
                        <img className="user-avt" src={a3} alt="User" />
                        <div>
                            <strong>Sami Rafi</strong><br />
                            <small>Sami is online</small>
                        </div>
                    </div>
                </div>

                <div className="sidebar-bottom d-flex justify-content-around align-items-center">
                    <button
                        className="sidebar-bottom-btn btn"
                        onClick={() => setShowModal(true)}
                    >
                        <i className="sidebar-bottom_icon bi bi-person-circle text-light"></i>
                    </button>
                    <button className="sidebar-bottom-btn btn" onClick={() => setCurrentView('chat')}>
                        <i className="sidebar-bottom_icon bi bi-chat-dots text-light"></i>
                    </button>
                    <button className="sidebar-bottom-btn btn active" onClick={() => setCurrentView('contacts')}>
                        <i className="sidebar-bottom_icon bi bi-person-rolodex text-light"></i>
                    </button>
                    <button className="sidebar-bottom-btn btn" onClick={() => setCurrentView('cloud')}>
                        <i className="sidebar-bottom_icon bi bi-cloud text-light"></i>
                    </button>
                    <button className="sidebar-bottom-btn btn" onClick={() => setCurrentView('setting')}>
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
                  <small className="text-muted text-light">
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

            {/* Chat Box - Now showing contacts */}
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

                <div className="contacts-list">
                    {filteredContacts.map((contact) => (
                        <div key={contact.id} className="contact-item">
                            <div className="d-flex align-items-center">
                                <div className="contact-avatar">
                                    <img src={contact.avatar} alt={contact.name} className="user-avt" />
                                    <span className={`status-indicator ${contact.online ? 'online' : 'offline'}`}></span>
                                </div>
                                <div className="contact-info">
                                    <h5 className="mb-0">{contact.name}</h5>
                                    <small>{contact.online ? 'Online' : 'Offline'}</small>
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
        </div>
    );
}

export default Contacts;