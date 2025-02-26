import React, { useState } from "react";
import "./contacts_style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import a1 from "../../assets/imgs/9306614.jpg";
import a2 from "../../assets/imgs/9334176.jpg";
import a3 from "../../assets/imgs/1.jpg";

function Contacts() {
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

      <div className="contacts-list">
        {filteredContacts.map((contact) => (
          <div key={contact.id} className="contact-item">
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
