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
                    <button className="sidebar-bottom-btn btn">
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