import React, { useState, useEffect, useRef, useCallback } from "react";
import Chat from "../chatting/chat";
import Setting from "../setting/setting";
import Cloud from "../cloud/cloud";
import Contacts from "../contacts/contacts";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import a3 from "../../assets/imgs/1.jpg";

import fetchFriends from "../../API/api_getListFriends";
import getUser from "../../API/api_getUser";
import getUserbySearch from "../../API/api_searchUSer";
import getConversations from "../../API/api_getConversation";
import checkChatRoom from "../../API/api_checkChatRoom";
import getChatRoom from "../../API/api_getChatRoombyChatRoomId";
import "./style.css";

function View({ setIsLoggedIn }) {
  const [currentView, setCurrentView] = useState("chat");
  const [keyWord, setKeyWord] = useState("");
  const [userChatting, setUserChatting] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editInfo, setEditInfo] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [chatRoom, setChatRoom] = useState({});
  const [userSearch, setUserSearch] = useState([]);
  const [isSearchVisible, setIsSearchVisible] = useState(false); // Trạng thái hiển thị danh sách
  const searchRef = useRef(null); // Tham chiếu đến phần tử danh sách tìm kiếm
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [hasNewFriendRequest, setHasNewFriendRequest] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case "chat":
        return (
          <Chat
            setCurrentView={setCurrentView}
            chatRoom={chatRoom || {}}
            userChatting={userChatting || []}
            user={userInfo || {}}
            updateLastMessage={updateLastMessage}
          />
        );
      case "setting":
        return (
          <Setting
            setCurrentView={setCurrentView}
            setIsLoggedIn={setIsLoggedIn}
          />
        );
      case "cloud":
        return <Cloud setCurrentView={setCurrentView} />;
      case "contacts":
        return (
          <Contacts
            setCurrentView={setCurrentView}
            friendRequests={friendRequests} // Truyền danh sách lời mời kết bạn
            friends={friends} // Truyền danh sách bạn bè
            handleAcceptFriendRequest={handleAcceptFriendRequest} // Truyền hàm chấp nhận
            handleRejectFriendRequest={handleRejectFriendRequest} // Truyền hàm từ chối
          />
        );
      default:
        return <Chat setCurrentView={setCurrentView} />;
    }
  };

  const [currentDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate()
  });

  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getUser();
        if (data) {
          setUserInfo(data);
          const editData = { ...data };
          if (data.dob) {
            const [year, month, day] = data.dob.split("-");
            editData.year = year;
            editData.month = parseInt(month, 10);
            editData.day = parseInt(day, 10);
          }
          setEditInfo(editData);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUser();
  }, []);

  const fetchFriendRequests = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Vui lòng đăng nhập!");
      return;
    }

    try {
      const response = await fetch("http://localhost:3824/user/friendRequests", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Lỗi khi lấy danh sách lời mời kết bạn!");

      const data = await response.json();

      // Kiểm tra nếu có lời mời mới
      if (data.length > friendRequests.length) {
        setHasNewFriendRequest(true);
      }

      setFriendRequests(data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách lời mời kết bạn:", error);
      toast.error("Không thể lấy danh sách lời mời kết bạn!");
    }
  }, [friendRequests.length]); // Thêm dependency nếu cần

  useEffect(() => {
    fetchFriendRequests();
  }, [fetchFriendRequests]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     fetchFriendRequests();
  //   }, 2000);

  //   return () => clearInterval(interval); // Cleanup interval on component unmount
  // }, [fetchFriendRequests]);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     fetchFriends()
  //   }, 1000);

  //   return () => clearInterval(interval); // Cleanup interval on component unmount
  // }, [fetchFriends]);

  const handleEdit = () => {
    const editData = { ...userInfo };
    // Xử lý ngày sinh
    if (userInfo?.dob) {
      const [year, month, day] = userInfo.dob.split('-');
      editData.year = parseInt(year, 10);
      editData.month = parseInt(month, 10);
      editData.day = parseInt(day, 10);
    } else {

      const defaultDate = new Date();
      defaultDate.setMonth(defaultDate.getMonth() - 1);
      editData.year = defaultDate.getFullYear();
      editData.month = defaultDate.getMonth() + 1;
      editData.day = defaultDate.getDate();
    }

    setEditInfo(editData);
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditInfo((prev) => {
      const newInfo = { ...prev };

      if (name === "year" || name === "month" || name === "day") {
        newInfo[name] = parseInt(value, 10);
      } else {
        newInfo[name] = value;
      }

      // Kiểm tra ngày tháng để ngăn ngày tương lai
      if (name === "year" || name === "month") {
        // Nếu năm là năm hiện tại, kiểm tra tháng
        if (newInfo.year === currentDate.year) {
          // Nếu tháng lớn hơn tháng hiện tại, đặt lại thành tháng hiện tại
          if (newInfo.month > currentDate.month) {
            newInfo.month = currentDate.month;
            if (newInfo.day > currentDate.day) {
              newInfo.day = currentDate.day;
            }
          } else if (newInfo.month === currentDate.month && newInfo.day > currentDate.day) {
            if (newInfo.day > currentDate.day) {
              newInfo.day = currentDate.day;
            }
          }
        }

        //kiểm tra xem ngày hiện tại có hợp lệ cho tháng,năm mới kh
        if (newInfo.year && newInfo.month && newInfo.day) {
          const daysInMonth = getDaysInMonth(newInfo.year, newInfo.month);
          if (newInfo.day > daysInMonth) {
            newInfo.day = daysInMonth;
          }
        }
      }

      if (name === "day") {
        if (newInfo.year === currentDate.year && newInfo.month === currentDate.month) {
          //nếu ngày lớn hơn ngày hiện tại, đặt lại thành ngày hiện tại
          if (newInfo.day > currentDate.day) {
            newInfo.day = currentDate.day;
          }
        }
      }

      return newInfo;
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      setEditInfo((prev) => ({ ...prev, avatar: file }));
    }
  };

  const handleSaveChanges = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Không có token, vui lòng đăng nhập lại!", {
        position: "top-right",
      });
      return;
    }

    let dob = editInfo.dob;
    if (editInfo.year && editInfo.month && editInfo.day) {
      const formattedMonth = String(editInfo.month).padStart(2, "0");
      const formattedDay = String(editInfo.day).padStart(2, "0");
      dob = `${editInfo.year}-${formattedMonth}-${formattedDay}`;
    }

    console.log("Dữ liệu gửi đi:", {
      fullName: editInfo.fullName,
      dob: dob,
      gender: editInfo.gender,
    });

    try {
      const response = await fetch("http://localhost:3824/user/update", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: editInfo.fullName,
          dob: dob,
          gender: editInfo.gender,
        }),
      });

      if (!response.ok) throw new Error("Cập nhật thất bại!");

      const updatedUser = await response.json();
      setUserInfo(updatedUser.user);
      setShowEditModal(false);
      setShowModal(true);
      toast.success("Cập nhật thông tin thành công!", {
        position: "top-right",
      });
    } catch (error) {
      toast.error("Cập nhật thông tin thất bại!", { position: "top-right" });
    }
  };

  const handleAvatarUpload = async () => {
    const token = localStorage.getItem("accessToken");
    const avatarFile = editInfo.avatar; //file được chọn lưu trong editInfo sau khi người dùng chọn file
    if (!token || !avatarFile) {
      toast.error("Vui lòng chọn ảnh trước!", { position: "top-right" });
      return;
    }

    const formData = new FormData();
    formData.append("avatar", avatarFile);

    try {
      const response = await fetch("http://localhost:3824/user/update-avatar", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // Không set header "Content-Type" khi gửi FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cập nhật avatar thất bại: ${errorText}`);
      }

      const data = await response.json();

      setUserInfo(data.user);
      setAvatarPreview(null);
      toast.success("Cập nhật avatar thành công!", { position: "top-right" });
      // setNotification({ show: true, message: "Cập nhật avatar thành công!", type: "success" });
      // setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 5000);
    } catch (error) {
      toast.error("Cập nhật avatar thất bại!", { position: "top-right" });
      // setNotification({ show: true, message: error.message || "Cập nhật avatar thất bại!", type: "error" });
      // setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 5000);
    }
  };

  const handleGetUserbyKey = async (e) => {
    e.preventDefault();

    if (!keyWord.trim()) {
      toast.warning("Vui lòng nhập từ khóa tìm kiếm.");
      return;
    }

    try {
      const result = await getUserbySearch(keyWord, keyWord);

      if (!result || result.length === 0) {
        toast.warning("Không tìm thấy user!");
        setUserSearch([]);
      } else {
        // Lọc bỏ chính số điện thoại của người dùng
        const filteredResult = result.filter(
          (user) => user.phoneNumber !== userInfo.phoneNumber
        );

        if (filteredResult.length === 0) {
          toast.warning("Không tìm thấy user phù hợp!");
        }

        setUserSearch(filteredResult);
        setIsSearchVisible(true); // Hiển thị danh sách khi có kết quả
      }
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
      toast.warning("Lỗi khi tìm kiếm user!");
    }
  };

  const [userChatList, setUserChatList] = useState([]);
  const [reloadConversations, setReloadConversations] = useState(false);

  useEffect(() => {
    if (!userInfo?.phoneNumber) return;

    let isMounted = true;
    (async () => {
      const data = await getConversations();
      if (!isMounted || !data?.length) return;

      const myPhone = userInfo.phoneNumber;
      const userData = await Promise.all(
        data.map(async (convo) => {
          if (convo.isGroup) {
            return {
              name: convo.fullName,
              avatar: convo.avatar,
              isUnreadBy:
                Array.isArray(convo.isUnreadBy) &&
                convo.isUnreadBy.includes(myPhone),
              lastMessage: convo.lastMessage,
              lastMessageAt: convo.lastMessageAt, // ⚠️ bạn cần đảm bảo trường này tồn tại
              isGroup: true,
              chatRoomId: convo.chatRoomId,
            };
          }

          const partnerPhone = convo.participants.find((p) => p !== myPhone);
          if (!partnerPhone) return null;
          const userArray = await getUserbySearch(partnerPhone, "");
          const user = Array.isArray(userArray) ? userArray[0] : userArray;
          return user
            ? {
              ...user,
              lastMessage: convo.lastMessage,
              lastMessageAt: convo.lastMessageAt, // ⚠️ cần trường này
              isUnreadBy:
                Array.isArray(convo.isUnreadBy) &&
                convo.isUnreadBy.includes(myPhone),
              isGroup: false,
              chatRoomId: convo.chatRoomId,
            }
            : null;
        })
      );

      const filteredList = userData.filter((u) => u !== null);

      const sortedList = filteredList.sort((a, b) => {
        const parseTime = (str) => {
          if (!str) return new Date(0); // fallback cho item không có thời gian
          const [time, date] = str.split(" ");
          const [h, m, s] = time.split(":").map(Number);
          const [d, mo, y] = date.split("/").map(Number);
          return new Date(y, mo - 1, d, h, m, s);
        };

        return parseTime(b.lastMessageAt) - parseTime(a.lastMessageAt);
      });

      setUserChatList(sortedList);
    })();

    return () => {
      isMounted = false;
    };
  }, [userInfo?.phoneNumber, reloadConversations]);


  const check = async (phone1, phone2, Id) => {
    try {
      const chatting = await getUserbySearch(phone2, "");

      const chatId = [phone1, phone2].sort().join("_");
      const chatRoomId = Id;
      console.log("CHat CHat ", chatRoomId)
      const chatRoomInfo = await getChatRoom(chatRoomId);
      if (chatRoomInfo.isGroup) {
        console.warn("Cảnh báo: Chat đơn nhưng trả về chatRoom nhóm!");
        chatRoomInfo.isGroup = false;
      }

      setChatRoom(chatRoomInfo);
      setUserChatting(Array.isArray(chatting) ? [chatting[0]] : []);

      await markAsRead(chatId);
    } catch (error) {
      console.error("Lỗi trong check():", error.message);
    }
  };


  const checkGroup = async (chatRoomId) => {
    const chatRoomInfo = await getChatRoom(chatRoomId);
    setChatRoom(chatRoomInfo);

    const otherUsers = chatRoomInfo.participants.filter(
      (phone) => phone !== userInfo.phoneNumber
    );

    // Lấy thông tin user từ getUserbySearch
    const users = await Promise.all(
      otherUsers.map(async (phone) => {
        const result = await getUserbySearch(phone, "");
        // Lấy phần tử đầu tiên trong mảng trả về từ getUserbySearch
        return result.length > 0 ? result[0] : null;
      })
    );

    const usersData = users.filter((user) => user !== null); // Loại bỏ các phần tử null

    setUserChatting(usersData); // Dù là group, vẫn truyền danh sách còn lại
  };


  const updateLastMessage = (chatRoomId, message) => {
    setUserChatList((prevList) => {
      const updatedList = prevList.map((conversation) => {
        if (!conversation || !conversation.chatRoomId) return conversation;

        if (conversation.chatRoomId === chatRoomId) {
          return { ...conversation, lastMessage: message };
        }
        return conversation;
      });

      const updated = updatedList.find((c) => c?.chatRoomId === chatRoomId);
      const others = updatedList.filter((c) => c?.chatRoomId !== chatRoomId);
      return updated ? [updated, ...others] : updatedList;
    });
  };

  console.log("🔍 userChatList:", userChatList);



  const renderLastMessage = (lastMessage) => {
    if (!lastMessage) return "Chưa Có";

    try {
      const parsed = JSON.parse(lastMessage);
      if (parsed.name && parsed.url && parsed.size && parsed.type) {
        return "Vừa gửi một file";
      }
    } catch (e) { }

    if (lastMessage.endsWith(".mp3")) {
      return "Tin nhắn thoại";
    }

    return lastMessage;
  };

  const markAsRead = async (chatId) => {
    try {
      const res = await fetch("http://localhost:3618/markAsRead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          phoneNumber: userInfo.phoneNumber, // Thêm phoneNumber
        }),
      });

      if (!res.ok) throw new Error("Update failed");

      const updatedConversations = await getConversations();
      const myPhone = userInfo.phoneNumber;

      const updatedUserData = await Promise.all(
        updatedConversations.map(async (convo) => {
          const partnerPhone = convo.participants.find((p) => p !== myPhone);

          if (!partnerPhone) return null;

          const userArray = await getUserbySearch(partnerPhone, "");
          const user = Array.isArray(userArray) ? userArray[0] : userArray;

          return user
            ? {
              ...user,
              lastMessage: convo.lastMessage,
              isUnreadBy:
                Array.isArray(convo.isUnreadBy) &&
                convo.isUnreadBy.includes(myPhone),
            }
            : null;
        })
      );

      setUserChatList(updatedUserData.filter((user) => user !== null));
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đọc:", error);
    }
  };

  const unreadCount = userChatList.filter((user) => user.isUnreadBy).length;

  const createChatRoomAndConversation = async (
    currentUserPhone,
    targetUserPhone
  ) => {
    try {
      // Tạo chatRoomId ngẫu nhiên bắt đầu bằng chữ 'c' và 3-5 số ngẫu nhiên
      const sortedPhones = [currentUserPhone, targetUserPhone].sort();
      const chatId = `${sortedPhones[0]}_${sortedPhones[1]}`;

      const checkRes = await fetch(
        "http://localhost:3618/checkConversationExist",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ chatId }),
        }
      );

      const checkData = await checkRes.json();

      if (checkData.exists) {
        console.log("Conversation đã tồn tại với chatId:", checkData.chatId);
        return; // không tạo lại nữa
      }

      const chatRoomId = `C${Math.floor(100 + Math.random() * 90000)}`;

      const chatRoomData = {
        chatRoomId,
        isGroup: false,
        participants: [currentUserPhone, targetUserPhone],
      };

      console.log(chatRoomData);

      // Gửi dữ liệu lên bảng ChatRooms
      await fetch("http://localhost:3618/createChatRoom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatRoomData),
      });

      // Dữ liệu cho bảng Conservations
      const conversationData = {
        chatId,
        chatRoomId,
        participants: sortedPhones,
      };

      // Gửi dữ liệu lên bảng Conservations
      await fetch("http://localhost:3618/createConversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(conversationData),
      });

      console.log("ChatRoom và Conversation đã được tạo thành công!");
    } catch (error) {
      console.error("Lỗi khi tạo ChatRoom và Conversation:", error);
    }
  };

  // Chỉnh sửa sự kiện onClick trong danh sách tìm kiếm
  const handleUserClick = async (currentUserPhone, targetUserPhone) => {
    await createChatRoomAndConversation(currentUserPhone, targetUserPhone);
    check(currentUserPhone, targetUserPhone); // Gọi hàm check để cập nhật giao diện
  };

  // Ẩn danh sách khi nhấn ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchVisible(false); // Ẩn danh sách khi nhấn ra ngoài
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSendFriendRequest = async (receiverPhone) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Vui lòng đăng nhập để gửi yêu cầu kết bạn!");
        return;
      }

      const response = await fetch("http://localhost:3824/user/sendFriendRequest", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receiverPhone }),
      });

      if (!response.ok) throw new Error("Gửi yêu cầu kết bạn thất bại!");

      toast.success("Gửi yêu cầu kết bạn thành công!");
    } catch (error) {
      console.error("Lỗi gửi yêu cầu kết bạn:", error);
      toast.error("Lỗi khi gửi yêu cầu kết bạn!");
    }
  };

  const handleAcceptFriendRequest = async (requestId) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Vui lòng đăng nhập!");
      return;
    }

    try {
      const response = await fetch("http://localhost:3824/user/acceptFriendRequest", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) throw new Error("Chấp nhận lời mời kết bạn thất bại!");

      toast.success("Đã chấp nhận lời mời kết bạn!");
      fetchFriendRequests(); // Cập nhật lại danh sách lời mời
    } catch (error) {
      console.error("Lỗi khi chấp nhận lời mời kết bạn:", error);
      toast.error("Không thể chấp nhận lời mời kết bạn!");
    }
  };

  const handleRejectFriendRequest = async (requestId) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Vui lòng đăng nhập!");
      return;
    }

    try {
      const response = await fetch("http://localhost:3824/user/rejectFriendRequest", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) throw new Error("Từ chối lời mời kết bạn thất bại!");

      toast.success("Đã từ chối lời mời kết bạn!");
      fetchFriendRequests(); // Cập nhật lại danh sách lời mời
    } catch (error) {
      console.error("Lỗi khi từ chối lời mời kết bạn:", error);
      toast.error("Không thể từ chối lời mời kết bạn!");
    }
  };

  return (
    <div className="wrapper">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header" style={{ position: "relative" }}>
          <form className="sidebar-header_search" onSubmit={handleGetUserbyKey}>
            <input
              type="search"
              placeholder="Search..."
              style={{ flex: 1 }}
              value={keyWord}
              onChange={(e) => setKeyWord(e.target.value)}
            />
            <button className="btn" type="submit">
              <i className="bi bi-search text-light"></i>
            </button>
          </form>

          {isSearchVisible && userSearch.length > 0 && (
            <div className="search_theme" ref={searchRef}>
              <ul className="m-0 p-0" style={{ flex: 1 }}>
                {userSearch.map((user, index) => {
                  const isFriend = friends.some((friend) => friend.phoneNumber === user.phoneNumber);

                  return (
                    <li
                      key={user.id || user.phoneNumber || index}
                      style={{
                        listStyleType: "none",
                        width: "100%",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        padding: "10px",
                        borderRadius: "8px",
                        transition: "background 0.2s ease-in-out",
                        justifyContent: "space-between", // Thêm để căn nút sang phải
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#222")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                        }}
                        onClick={() =>
                          handleUserClick(userInfo.phoneNumber, user.phoneNumber)
                        }
                      >
                        <img
                          className="user-avt"
                          src={user?.avatar}
                          alt="Avatar"
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                          }}
                        />
                        <span
                          className="mx-4"
                          style={{ fontSize: "16px", fontWeight: "500" }}
                        >
                          {user.fullName}
                        </span>
                      </div>
                      {!isFriend && ( // Chỉ hiển thị nút "Thêm bạn" nếu chưa kết bạn
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation(); // Ngăn sự kiện click lan sang phần tử cha
                            handleSendFriendRequest(user.phoneNumber);
                          }}
                        >
                          Thêm bạn
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* User List */}
        <div className="user-list">
          {userChatList.length > 0 ? (
            userChatList.map((user) => (
              <div
                className="user"
                key={user.chatRoomId}
                onClick={async () => {

                  if (user.isGroup) {
                    await checkGroup(user.chatRoomId);
                  } else if (user.phoneNumber) {
                    await check(userInfo.phoneNumber, user.phoneNumber, user.chatRoomId);
                  }

                  setReloadConversations((prev) => !prev);
                }}
              >
                <img className="user-avt" src={user.avatar} alt="User" />
                <div>
                  <strong>
                    {user.isGroup
                      ? user.name || "Nhóm chưa đặt tên"
                      : user.fullName || "Chưa cập nhật"}
                  </strong>
                  <br />
                  <small className={user.isUnreadBy ? "bold-message" : ""}>
                    {renderLastMessage(user.lastMessage)}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <p style={{ padding: "0 50px" }}>
              Hãy tìm bạn bè bằng số điện thoại và trò chuyện với họ ngay nào!
            </p>
          )}
        </div>


        <div className="sidebar-bottom d-flex justify-content-around align-items-center">
          <button
            className="sidebar-bottom-btn btn"
            onClick={() => setShowModal(true)}
          >
            <i className="sidebar-bottom_icon bi bi-person-circle text-light"></i>
          </button>
          <div
            className="sidebar-bottom-btn btn active"
            onClick={() => setCurrentView("chat")}
            style={{ position: "relative" }}
          >
            <i className="sidebar-bottom_icon bi bi-chat-dots text-light"></i>
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "5px",
                  right: "5px",
                  backgroundColor: "red",
                  color: "white",
                  borderRadius: "50%",
                  padding: "2px 6px",
                  fontSize: "12px",
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <button
            className={`sidebar-bottom-btn btn ${hasNewFriendRequest ? "active" : ""}`}
            onClick={() => {
              setCurrentView("contacts");
              setHasNewFriendRequest(false);
            }}
            style={{ position: "relative" }}
          >
            <i className="sidebar-bottom_icon bi bi-person-rolodex text-light"></i>
            {hasNewFriendRequest && (
              <span
                style={{
                  position: "absolute",
                  top: "5px",
                  right: "5px",
                  backgroundColor: "red",
                  color: "white",
                  borderRadius: "50%",
                  padding: "2px 6px",
                  fontSize: "12px",
                }}
              >
                !
              </span>
            )}
          </button>
          {/* <button
            className="sidebar-bottom-btn btn"
            onClick={() => setCurrentView("cloud")}
          >
            <i className="sidebar-bottom_icon bi bi-cloud text-light"></i>
          </button> */}
          <button
            className="sidebar-bottom-btn btn"
            onClick={() => setCurrentView("setting")}
          >
            <i className="sidebar-bottom_icon bi bi-gear text-light"></i>
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="content">{renderView()}</div>

      {/* Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-0">
              <div className="modal-header d-flex align-items-center">
                <h5 className="modal-title flex-grow-1">Thông tin tài khoản</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body text-center">
                <div className="d-flex justify-content-center position-relative avatar-wrapper">
                  <img
                    className="user-avt"
                    src={avatarPreview || userInfo?.avatar || a3}
                    alt="User Avatar"
                    style={{
                      width: "80px",
                      height: "80px",
                      objectFit: "cover",
                      border: "2px solid white",
                    }}
                  />
                  <label className="edit-avatar-icon" htmlFor="avatar-upload">
                    <i className="bi bi-pencil-fill"></i>
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleAvatarChange}
                  />
                </div>
                {avatarPreview && (
                  <div className="mt-2">
                    <button
                      className="btn btn-sm btn-primary me-2"
                      onClick={handleAvatarUpload}
                    >
                      Cập nhật ảnh
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => {
                        setAvatarPreview(null);
                        setEditInfo((prev) => ({ ...prev, avatar: null }));
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                )}
                <h5 className="fw-bold mt-3 mb-4">
                  {userInfo ? userInfo.fullName : "Chưa có tên"}
                </h5>
                <div className="text-start px-3">
                  <h6 className="text-center">
                    <strong>Thông tin cá nhân</strong>
                  </h6>
                  {/* 
                    <p>
                      Giới tính: <strong>{userInfo?.gender || "Chưa cập nhật"}</strong>
                    </p> */}
                  {/* <p>
                      Ngày sinh: <strong>{userInfo?.dob || "Chưa cập nhật"}</strong>
                    </p>
                    <p>
                      Điện thoại: <strong>{userInfo?.phoneNumber || "Chưa cập nhật"}</strong>
                    </p> */}
                  <p>
                    Email: <strong>{userInfo?.email || "Chưa cập nhật"}</strong>
                  </p>

                  <p>
                    Giới tính:{" "}
                    <strong>
                      {userInfo?.gender === "Male"
                        ? "Nam"
                        : userInfo?.gender === "Female"
                          ? "Nữ"
                          : "Chưa cập nhật"}
                    </strong>
                  </p>
                  <p>
                    Ngày sinh:{" "}
                    <strong>{userInfo?.dob || "Chưa cập nhật"}</strong>
                  </p>
                  <p>
                    Điện thoại:{" "}
                    <strong>{userInfo?.phoneNumber || "Chưa cập nhật"}</strong>
                  </p>
                </div>
              </div>
              <div className="modal-footer bg-dark">
                <button
                  type="button"
                  className="btn w-100 py-3 custom-button"
                  onClick={() => {
                    setShowModal(false);
                    handleEdit();
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
            <div className="modal-content p-0">
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
                      name="fullName"
                      value={editInfo.fullName || ""}
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
                          value="Male"
                          checked={editInfo?.gender === "Male"}
                          onChange={handleEditChange}
                        />
                        <label className="form-check-label" htmlFor="genderMale">
                          Nam
                        </label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="gender"
                          id="genderFemale"
                          value="Female"
                          checked={editInfo?.gender === "Female"}
                          onChange={handleEditChange}
                        />
                        <label className="form-check-label" htmlFor="genderFemale">
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
                        value={editInfo.day || ""}
                        onChange={handleEditChange}
                      >
                        <option value="" disabled>Ngày</option>
                        {editInfo.year && editInfo.month ?
                          Array.from({ length: getDaysInMonth(editInfo.year, editInfo.month) }, (_, i) => {
                            const day = i + 1;
                            const isDisabled = editInfo.year === currentDate.year &&
                              editInfo.month === currentDate.month &&
                              day > currentDate.day;
                            return (
                              <option key={day} value={day} disabled={isDisabled}>
                                {day}
                              </option>
                            );
                          })
                          :
                          // Mặc định hiển thị 31 ngày nếu chưa chọn tháng hoặc năm
                          Array.from({ length: 31 }, (_, i) => {
                            const day = i + 1;
                            const isDisabled = editInfo.year === currentDate.year &&
                              editInfo.month === currentDate.month &&
                              day > currentDate.day;
                            return (
                              <option key={day} value={day} disabled={isDisabled}>
                                {day}
                              </option>
                            );
                          })
                        }
                      </select>
                      <select
                        className="form-select me-2"
                        name="month"
                        value={editInfo.month || ""}
                        onChange={handleEditChange}
                      >
                        <option value="" disabled>Tháng</option>
                        {Array.from({ length: 12 }, (_, i) => {
                          const month = i + 1;
                          const isDisabled = editInfo.year === currentDate.year && month > currentDate.month;
                          return (
                            <option key={month} value={month} disabled={isDisabled}>
                              Tháng {month}
                            </option>
                          );
                        })}
                      </select>
                      <select
                        className="form-select"
                        name="year"
                        value={editInfo.year || ""}
                        onChange={handleEditChange}
                      >
                        <option value="" disabled>Năm</option>
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
    </div>
  );
}

export default View;