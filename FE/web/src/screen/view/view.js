import React, { useState, useEffect, useRef, useCallback } from "react";
import Chat from "../chatting/chat";
import Setting from "../setting/setting";
import Cloud from "../cloud/cloud";
import Contacts from "../contacts/contacts";
import io from "socket.io-client";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { playNotificationSound } from "../../utils/sound.js";
import a3 from "../../assets/imgs/9334176.jpg";
import getUser from "../../API/api_getUser";
import getUserInfo from "../../API/api_getUser";
import getUserbySearch from "../../API/api_searchUSer";
import getConversations from "../../API/api_getConversation";
import createChatRoom from "../../API/api_createChatRoom";
import checkChatRoom from "../../API/api_checkChatRoom";
import getChatRoom from "../../API/api_getChatRoombyChatRoomId";
import "./style.css";
import createChatRoomGroup from "../../API/api_createChatRoomforGroup";
import useFetchUserChatList from "../../hooks/refetch_Conversation.js";

const socket = io("http://localhost:3618");
const notificationSocket = io("http://localhost:3515");

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
  const [userChatList, setUserChatList] = useState([]);
  const [reloadConversations, setReloadConversations] = useState(false);
  const [modalListFriends, setModalListFriends] = useState(false);
  const [listFriends, setListFriends] = useState([]);
  const [nameGroup, setNameGroup] = useState("");
  const [listAddtoGroup, setListAddtoGroup] = useState([]);
  const [thisUser, setThisUser] = useState(null);
  const [selectedChatRoomId, setSelectedChatRoomId] = useState(null);
  const optionsRef = useRef(null);

  const toggleOptions = (chatRoomId) => {
    setSelectedChatRoomId((prev) => (prev === chatRoomId ? null : chatRoomId));
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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getUserInfo();
        if (data) {
          setThisUser(data);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (userInfo?.phoneNumber) {
      socket.emit("joinRoom", userInfo.phoneNumber);
    }
  }, [userInfo]);

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

  useEffect(() => {
    if (!thisUser?.phoneNumber) return;

    const handleNewChatRoom = async (data) => {
      console.log("Nhận thông báo phòng chat mới:", data);

      if (data.createdBy !== thisUser.phoneNumber) {
        const u = await getUserbySearch(data.createdBy, "");
        playNotificationSound();
        toast.success(
          `${u[0]?.fullName || "Ai đó"} đã thêm bạn vào nhóm ${data.groupName}`
        );
      }

      const newChatRoom = {
        name: data.groupName || "Nhóm mới", // hoặc data.nameGroup
        avatar: data.avatar || "", // ảnh nhóm nếu có
        isGroup: true,
        chatRoomId: data.chatRoomId,
        lastMessage: "",
        lastMessageAt: null,
        isUnreadBy: [],
        fullName: "", // để không bị lỗi khi là group (dùng `name` thay thế)
      };

      setUserChatList((prevList) => {
        // Nếu đã có trong list thì không thêm lại
        const existed = prevList.some(
          (room) => room.chatRoomId === newChatRoom.chatRoomId
        );
        if (existed) return prevList;

        const updatedList = [newChatRoom, ...prevList];
        return updatedList.sort((a, b) => {
          const parseTime = (str) => {
            if (!str) return new Date(0);
            const [time, date] = str.split(" ");
            const [h, m, s] = time.split(":").map(Number);
            const [d, mo, y] = date.split("/").map(Number);
            return new Date(y, mo - 1, d, h, m, s);
          };
          return parseTime(b.lastMessageAt) - parseTime(a.lastMessageAt);
        });
      });
    };

    socket.on("newChatRoom", handleNewChatRoom);

    return () => {
      socket.off("newChatRoom", handleNewChatRoom);
    };
  }, [thisUser?.phoneNumber]);

  const handleTogglePhoneNumber = (phoneNumber) => {
    setListAddtoGroup((prev) => {
      const mustHave = [userInfo.phoneNumber];
      const withoutRemoved = prev.filter((p) => p !== phoneNumber);
      const isAlreadyChecked = prev.includes(phoneNumber);

      const newList = isAlreadyChecked
        ? withoutRemoved
        : [...prev, phoneNumber];

      const finalList = Array.from(new Set([...newList, ...mustHave]));
      return finalList;
    });
  };

  const openCreateModal = async () => {
    setNameGroup("");
    setListAddtoGroup([]);

    setModalListFriends(true);
    setListFriends(friends);
  };

  const handleSaveGroup = async () => {
    if (!nameGroup.trim() || !/^(?! )[A-Za-zÀ-ỹ0-9 ]{3,50}$/.test(nameGroup)) {
      toast.error("Tên nhóm không hợp lệ.");
      return;
    }
    if (listAddtoGroup.length < 3) {
      toast.error("Một nhóm phải có ít nhất ba thành viên.");
      return;
    }

    try {
      await createChatRoomGroup({
        nameGroup,
        createdBy: userInfo.phoneNumber,
        participants: listAddtoGroup,
      });
      toast.success("Tạo nhóm thành công!");
      setModalListFriends(false);
      return;
    } catch (error) {
      console.error("Lỗi khi tạo nhóm:", error);
      toast.error("Tạo nhóm thất bại!");
    }
  };

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

  const fetchFriends = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Vui lòng đăng nhập!");
      return;
    }

    try {
      const response = await fetch("http://localhost:3824/user/friends", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Lỗi khi lấy danh sách bạn bè!");

      const data = await response.json();
      setFriends(data);
    } catch (error) {

    }
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
    fetchFriends();
  }, [fetchFriendRequests, fetchFriends]);


  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     fetchFriendRequests();
  //   }, 2000);
  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  // Chỉ polling khi đang ở tab contacts
  useEffect(() => {
    if (currentView === "contacts") {
      const interval = setInterval(() => {
        fetchFriendRequests();
        fetchFriends();
      }, 2000);

  //   return () => clearInterval(interval); // Cleanup interval on component unmount
  // }, [fetchFriendRequests]);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     fetchFriends()
  //   }, 1000);

  //   return () => clearInterval(interval); // Cleanup interval on component unmount
  // }, [fetchFriends]);

  useEffect(() => {
    if (currentView === "contacts") {
      const interval = setInterval(() => {
        fetchFriendRequests();
        fetchFriends();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [currentView, fetchFriendRequests, fetchFriends]);

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
          } else if (
            newInfo.month === currentDate.month &&
            newInfo.day > currentDate.day
          ) {
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
              lastMessageAt: convo.lastMessageAt,
              isGroup: true,
              chatRoomId: convo.chatRoomId || null, // Đảm bảo chatRoomId tồn tại
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
                lastMessageAt: convo.lastMessageAt,
                isUnreadBy:
                  Array.isArray(convo.isUnreadBy) &&
                  convo.isUnreadBy.includes(myPhone),
                isGroup: false,
                chatRoomId: convo.chatRoomId || null, // Đảm bảo chatRoomId tồn tại
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
      if (!Id) {
        console.error("chatRoomId bị thiếu!");
        return;
      }

      const chatting = await getUserbySearch(phone2, "");
      const chatId = [phone1, phone2].sort().join("_");
      const chatRoomId = Id;

      console.log("CHat CHat ", chatRoomId);
      const chatRoomInfo = await getChatRoom(chatRoomId);

      if (!chatRoomInfo) {
        console.error("Không tìm thấy thông tin chatRoom với ID:", chatRoomId);
        return;
      }

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

  const renderLastMessage = (lastMessage) => {
    if (!lastMessage) return "Chưa Có";

    try {
      const parsed = JSON.parse(lastMessage);
      if (parsed.name && parsed.url && parsed.size && parsed.type) {
        return "Vừa gửi một file";
      }
    } catch (e) {}

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
      // Kiểm tra ChatRoom đã tồn tại
      const checkChatRoomRes = await fetch(
        `http://localhost:3618/checkChatRoom?myPhone=${currentUserPhone}&userPhone=${targetUserPhone}`
      );

      const checkChatRoomData = await checkChatRoomRes.json();

      console.log("checkChatRoomData", checkChatRoomData);

      let chatRoomId;

      if (checkChatRoomData?.chatRoomId) {
        console.log(
          "ChatRoom đã tồn tại với chatRoomId:",
          checkChatRoomData.chatRoomId
        );
        chatRoomId = checkChatRoomData.chatRoomId; // Sử dụng ChatRoom đã tồn tại
      } else {
        // Tạo mới ChatRoom nếu chưa tồn tại
        chatRoomId = `C${Math.floor(100 + Math.random() * 90000)}`;
        const chatRoomData = {
          chatRoomId,
          isGroup: false,
          participants: [currentUserPhone, targetUserPhone],
        };

        const createdChatRoom = await createChatRoom(chatRoomData);

        if (!createdChatRoom) {
          throw new Error("Tạo ChatRoom thất bại!");
        }

        console.log("ChatRoom mới đã được tạo với chatRoomId:", chatRoomId);
      }

      // Tạo mới Conversation
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
      const conversationRes = await fetch(
        "http://localhost:3618/createConversation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(conversationData),
        }
      );

      if (!conversationRes.ok) {
        throw new Error("Tạo Conversation thất bại!");
      }

      console.log("Conversation đã được tạo thành công!");
      return chatRoomId; // Trả về chatRoomId
    } catch (error) {
      console.error("Lỗi khi xử lý ChatRoom và Conversation:", error);
      return null; // Trả về null nếu có lỗi
    }
  };

  const handleUserClick = async (currentUserPhone, targetUserPhone) => {
    const chatRoomId = await createChatRoomAndConversation(
      currentUserPhone,
      targetUserPhone
    );
    if (chatRoomId) {
      await check(currentUserPhone, targetUserPhone, chatRoomId); // Truyền chatRoomId vào hàm check
    }
  };

  useEffect(() => {
    if (!socket || !userInfo?.phoneNumber) return;

    socket.emit("joinUser", userInfo.phoneNumber);

    const handleGroupCreated = async (data) => {
      console.log("Nhóm mới được tạo:", data);

      try {
        const response = await fetch("http://localhost:3618/chatRooms", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok)
          throw new Error("Không thể tải danh sách cuộc trò chuyện!");

        const chatRooms = await response.json();

        const updatedUserChatList = chatRooms.map((chatRoom) => {
          if (chatRoom.isGroup) {
            return {
              name: chatRoom.nameGroup || "Nhóm chưa đặt tên",
              avatar: chatRoom.avatar,
              isUnreadBy: chatRoom.isUnreadBy,
              lastMessage: chatRoom.lastMessage,
              lastMessageAt: chatRoom.lastMessageAt,
              isGroup: true,
              chatRoomId: chatRoom.chatRoomId,
            };
          } else {
            const otherUserPhone = chatRoom.participants.find(
              (phone) => phone !== userInfo.phoneNumber
            );

            return {
              fullName: otherUserPhone || "Chưa cập nhật",
              avatar: chatRoom.avatar,
              isUnreadBy: chatRoom.isUnreadBy,
              lastMessage: chatRoom.lastMessage,
              lastMessageAt: chatRoom.lastMessageAt,
              isGroup: false,
              chatRoomId: chatRoom.chatRoomId,
              phoneNumber: otherUserPhone,
            };
          }
        });

        setUserChatList(updatedUserChatList);
      } catch (error) {
        console.error("Lỗi khi tải danh sách cuộc trò chuyện:", error);
      }
    };

    socket.on("groupCreated", handleGroupCreated);

    return () => {
      socket.off("groupCreated", handleGroupCreated); // Dọn sạch chính xác callback
    };
  }, [userInfo?.phoneNumber]);

  // Ẩn danh sách khi nhấn ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchVisible(false); // Ẩn danh sách khi nhấn ra ngoài
      }
      if (
        !event.target.closest(".options-menu") &&
        !event.target.closest(".options-btn")
      ) {
        setSelectedChatRoomId(null); // Đóng menu khi nhấn ra ngoài
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

  // Hàm xử lý xóa hội thoại
  const handleDeleteConversation = async (chatRoomId) => {
    try {
      const response = await fetch(
        `http://localhost:3618/deleteConversation/${chatRoomId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Xóa hội thoại thất bại!");
      }

      // Cập nhật danh sách hội thoại sau khi xóa
      setUserChatList((prevList) =>
        prevList.filter((user) => user.chatRoomId !== chatRoomId)
      );

      // Reset màn hình chat
      setChatRoom({});
      setUserChatting([]);

      toast.success("Xóa hội thoại thành công!");
    } catch (error) {
      console.error("Lỗi khi xóa hội thoại:", error);
      toast.error("Không thể xóa hội thoại!");
    }
  };

  // Thêm useEffect để lắng nghe sự kiện newConversation
  useEffect(() => {
    if (!userInfo?.phoneNumber) return;

    // Join socket với số điện thoại của user
    socket.emit("joinUser", userInfo.phoneNumber);

    // Lắng nghe khi có conversation mới được tạo
    socket.on("newConversation", async (data) => {
      // Kiểm tra xem user hiện tại có trong conversation không
      if (data.participants.includes(userInfo.phoneNumber)) {
        try {
          // Lấy số điện thoại của người còn lại
          const otherUserPhone = data.participants.find(
            (phone) => phone !== userInfo.phoneNumber
          );

          // Fetch thông tin user
          const userResult = await getUserbySearch(
            otherUserPhone,
            otherUserPhone
          );
          const otherUserInfo = userResult[0];

          // Lấy danh sách conversation mới
          const conversations = await getConversations();

          // Cập nhật state conversations và userInfo
          setUserChatList(conversations);

          // Cập nhật thông tin user vào state quản lý thông tin user
          if (otherUserInfo) {
            setUserInfo((prev) => ({
              ...prev,
              [otherUserPhone]: otherUserInfo,
            }));
          }
        } catch (error) {
          console.error("Lỗi khi cập nhật conversation mới:", error);
        }
      }
    });

    return () => {
      socket.off("newConversation");
    };
  }, [userInfo?.phoneNumber]);

  return (
    <div className="wrapper">
      {/* Sidebar */}
      <div className="sidebar">
        <div
          className="sidebar-header row m-0"
          style={{ position: "relative" }}
        >
          <div className="col-11 p-0">
            <form
              className="sidebar-header_search"
              onSubmit={handleGetUserbyKey}
            >
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
                        onClick={(e) => {
                          e.stopPropagation(); // Ngăn sự kiện lan truyền
                          if (!userInfo?.phoneNumber) {
                            console.error("userInfo.phoneNumber bị thiếu!");
                            return;
                          }
                          if (!user?.phoneNumber) {
                            console.error("user.phoneNumber bị thiếu!");
                            return;
                          }
                          handleUserClick(
                            userInfo.phoneNumber,
                            user.phoneNumber
                          );
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                          }}
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

          <div className="col-1 m-0 p-0">
            <button
              className="btn btn-link"
              style={{ width: "100%", height: "100%" }}
              onClick={openCreateModal}
              tooltip="Tạo nhóm"
            >
              <i className="bi bi-plus-lg text-light"></i>
            </button>
          </div>
        </div>

        {/* User List */}
        {/* User List */}
        <div className="user-list">
          {userChatList.length > 0 ? (
            userChatList.map((user) => (
              <div
                className="user d-flex align-items-center justify-content-between"
                key={user.chatRoomId}
                onClick={async () => {
                  if (user.isGroup) {
                    await checkGroup(user.chatRoomId);
                  } else if (user.phoneNumber) {
                    await check(
                      userInfo.phoneNumber,
                      user.phoneNumber,
                      user.chatRoomId
                    );
                  }

                  setReloadConversations((prev) => !prev);
                }}
              >
                <div className="d-flex align-items-center">
                  <img
                    className="user-avt"
                    src={user.avatar || a3}
                    alt="User"
                  />
                  <div>
                    <strong>
                      {user.isGroup
                        ? user.name || "Loading..."
                        : user.fullName || "Loading..."}
                    </strong>
                    <br />
                    <small className={user.isUnreadBy ? "bold-message" : ""}>
                      {renderLastMessage(user.lastMessage)}
                    </small>
                  </div>
                </div>
                <div className="options">
                  <button
                    className="btn btn-link options-btn"
                    onClick={(e) => {
                      e.stopPropagation(); // Ngăn sự kiện click lan sang phần tử cha
                      toggleOptions(user.chatRoomId);
                    }}
                  >
                    <i className="bi bi-three-dots-vertical"></i>
                  </button>
                  {selectedChatRoomId === user.chatRoomId && (
                    <div className="options-menu">
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={(e) => {
                          e.stopPropagation(); // Ngăn sự kiện click lan sang phần tử cha
                          handleDeleteConversation(user.chatRoomId);
                        }}
                      >
                        Xóa hội thoại
                      </button>
                    </div>
                  )}
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

      {modalListFriends && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            role="document"
          >
            <div className="modal-content p-0">
              <div className="modal-header d-flex justify-content-between align-items-center">
                <h5 className="modal-title">Tạo Nhóm</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModalListFriends(false)}
                ></button>
              </div>

              <div className="modal-body">
                {/* Input tên nhóm */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Tên nhóm</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nhập tên nhóm..."
                    value={nameGroup}
                    onChange={(e) => setNameGroup(e.target.value)}
                  />
                </div>

                {/* Danh sách bạn bè có thể thêm */}
                {listFriends.length === 0 ? (
                  <p className="text-muted">Không có bạn bè nào.</p>
                ) : (
                  <div>
                    <p className="fw-bold">
                      Những người bạn có thể thêm vào nhóm
                    </p>
                    <ul className="list-group">
                      {listFriends.map((friend) => (
                        <li
                          key={friend.phoneNumber}
                          className="list-group-item d-flex justify-content-between align-items-center li-mem-group"
                          style={{
                            padding: "10px 15px",
                            borderRadius: "8px",
                            marginBottom: "8px",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                            transition: "background-color 0.3s",
                          }}
                        >
                          <div className="d-flex align-items-center">
                            <img
                              src={friend.avatar}
                              alt="avatar"
                              className="rounded-circle"
                              style={{
                                width: 45,
                                height: 45,
                                objectFit: "cover",
                                marginRight: 12,
                              }}
                            />
                            <span style={{ fontWeight: 500 }}>
                              {friend.fullName}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            style={{ transform: "scale(1.2)" }}
                            value={friend.phoneNumber}
                            onChange={() =>
                              handleTogglePhoneNumber(friend.phoneNumber)
                            }
                            checked={listAddtoGroup.includes(
                              friend.phoneNumber
                            )}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-primary w-100"
                  onClick={handleSaveGroup}
                >
                  Tạo nhóm
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
