import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  Modal
} from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from '@react-navigation/native';

import { useTheme } from "../contexts/themeContext";
import colors from "../themeColors";
import getUserbySearch from "../api/api_searchUSer";
import { useSearch } from "../contexts/searchContext";
import getIp from "../utils/getIp_notPORT";
import useFriends from "../api/api_getListFriends";
import useCurrentUser from "../hooks/useFetchCurrentUser";
import createGroupChatRoom from "../api/api_createChatRoomforGroup.js";
import eventEmitter from "../utils/EventEmitter";
const BASE_URL = getIp();

const Header = () => {
  const navigation = useNavigation();
  const { theme, toggleTheme } = useTheme();
  const themeColors = colors[theme];
  const [searchText, setSearchText] = useState("");
  const {
    isSearchVisible,
    setIsSearchVisible,
    searchResults,
    setSearchResults,
    hideSearch,
  } = useSearch();
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [friendsNotInGroup, setFriendsNotInGroup] = useState([]);
  const [newList, setNewList] = useState([]);
  const [groupName, setGroupName] = useState();

  const { currentUser, loading } = useCurrentUser();

  const { contacts, fetchFriends } = useFriends();

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const handleAddMemberToNewList = (phone) => {
    setNewList((prev) =>
      prev.includes(phone)
        ? prev.filter((item) => item !== phone)
        : [...prev, phone]
    );
  };

  const handleSearch = async () => {
    if (searchText.length > 0) {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        const userJson = await AsyncStorage.getItem("user");
        const currentUser = JSON.parse(userJson);

        if (!token || !currentUser) {
          Alert.alert("Lỗi", "Vui lòng đăng nhập để tìm kiếm!");
          return;
        }

        const result = await getUserbySearch(searchText, searchText);
        if (result && result.length > 0) {
          const resultsWithFriendStatus = await Promise.all(
            result.map(async (user) => {
              const isFriend = await checkFriendshipStatus(user.phoneNumber);
              return { ...user, isFriend };
            })
          );

          // Lọc bỏ các phần tử không hợp lệ
          const validResults = resultsWithFriendStatus.filter(
            (user) => user && user.fullName
          );

          setSearchResults(validResults);
          setIsSearchVisible(true);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Lỗi khi tìm kiếm:", error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  // const handleSearch = async () => {
  //   if (searchText.length > 0) {
  //     try {
  //       const token = await AsyncStorage.getItem("accessToken");
  //       const userJson = await AsyncStorage.getItem("user");
  //       const currentUser = JSON.parse(userJson);

  //       if (!token || !currentUser) {
  //         Alert.alert("Lỗi", "Vui lòng đăng nhập để tìm kiếm!");
  //         return;
  //       }

  //       const result = await getUserbySearch(searchText, searchText);
  //       if (result && result.length > 0) {
  //         // Sử dụng hàm checkFriendshipStatus thay vì gọi API trực tiếp
  //         const resultsWithFriendStatus = await Promise.all(
  //           result.map(async (user) => {
  //             const isFriend = await checkFriendshipStatus(user.phoneNumber);
  //             // console.log('Friendship status for', user.fullName, ':', isFriend);
  //             return { ...user, isFriend };
  //           })
  //         );

  //         // console.log('Search results with friendship status:', resultsWithFriendStatus);
  //         setSearchResults(resultsWithFriendStatus);
  //         setIsSearchVisible(true);
  //       } else {
  //         setSearchResults([]);
  //       }
  //     } catch (error) {
  //       console.error("Lỗi khi tìm kiếm:", error);
  //       setSearchResults([]);
  //     }
  //   } else {
  //     setSearchResults([]);
  //   }
  // };

  const handleOutsidePress = () => {
    hideSearch();
    Keyboard.dismiss();
  };

  const handleTextInputPress = () => {
    hideSearch();
  };

  const createChatRoomAndConversation = async (
    currentUserPhone,
    targetUserPhone
  ) => {
    try {
      // Tạo chatId từ 2 số điện thoại (sắp xếp để đảm bảo tính nhất quán)
      const sortedPhones = [currentUserPhone, targetUserPhone].sort();
      const chatId = `${sortedPhones[0]}_${sortedPhones[1]}`;

      // Kiểm tra xem conversation đã tồn tại chưa
      const checkRes = await fetch(
        `http://${BASE_URL}:3618/checkConversationExist`,
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
        return checkData.chatRoomId; // Trả về chatRoomId nếu đã tồn tại
      }

      // Tạo chatRoomId mới nếu chưa tồn tại
      const chatRoomId = `c${Math.floor(100 + Math.random() * 90000)}`;

      // Tạo chatRoom mới
      const chatRoomData = {
        chatRoomId,
        isGroup: false,
        participants: [currentUserPhone, targetUserPhone],
      };

      await fetch(`http://${BASE_URL}:3618/createChatRoom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatRoomData),
      });

      // Tạo conversation mới
      const conversationData = {
        chatId,
        chatRoomId,
        participants: sortedPhones,
      };

      // Gọi API tạo conversation và emit sự kiện
      await fetch(`http://${BASE_URL}:3618/createConversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...conversationData,
          shouldEmit: true // Thêm flag để server biết cần emit sự kiện
        }),
      });

      return chatRoomId;
    } catch (error) {
      console.error("Lỗi khi tạo ChatRoom và Conversation:", error);
      Alert.alert("Lỗi", "Không thể tạo cuộc trò chuyện mới");
      return null;
    }
  };

  const handleSendFriendRequest = async (receiverPhone) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập để gửi yêu cầu kết bạn!");
        return;
      }

      const response = await fetch(
        `http://${BASE_URL}:3824/user/sendFriendRequest`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ receiverPhone }),
        }
      );

      if (!response.ok) throw new Error("Gửi yêu cầu kết bạn thất bại!");

      Alert.alert("Thành công", "Gửi yêu cầu kết bạn thành công!");
    } catch (error) {
      console.error("Lỗi gửi yêu cầu kết bạn:", error);
      Alert.alert("Lỗi", "Không thể gửi yêu cầu kết bạn!");
    }
  };

  // Thêm hàm kiểm tra trạng thái bạn bè
  const checkFriendshipStatus = async (targetPhone) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const userJson = await AsyncStorage.getItem("user");
      const currentUser = JSON.parse(userJson);

      if (!token || !currentUser) return false;

      const response = await fetch(
        `http://${BASE_URL}:3824/user/checkFriendship`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPhone: currentUser.phoneNumber,
            targetPhone: targetPhone
          }),
        }
      );

      if (!response.ok) return false;
      const data = await response.json();
      return data.isFriend;
    } catch (error) {
      console.error("Lỗi kiểm tra trạng thái bạn bè:", error);
      return false;
    }
  };

  const handleChatNavigation = async (selectedUser) => {
  try {
    if (!selectedUser || !selectedUser.phoneNumber) {
      Alert.alert("Lỗi", "Không thể truy cập thông tin người dùng!");
      return;
    }

    const userJson = await AsyncStorage.getItem("user");
    const currentUser = JSON.parse(userJson);

    if (!currentUser) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập lại!");
      return;
    }

    const sortedPhones = [currentUser.phoneNumber, selectedUser.phoneNumber].sort();
    const chatId = `${sortedPhones[0]}_${sortedPhones[1]}`;

    const checkRes = await fetch(
      `http://${BASE_URL}:3618/checkConversationExist`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatId }),
      }
    );

    const checkData = await checkRes.json();
    let chatRoomId;

    if (checkData.exists) {
      chatRoomId = checkData.chatRoomId;
    } else {
      chatRoomId = await createChatRoomAndConversation(
        currentUser.phoneNumber,
        selectedUser.phoneNumber
      );
    }

    if (chatRoomId) {
      console.log("Conversation loaded:", chatRoomId);

      // Phát sự kiện để thông báo cập nhật danh sách conversations
      eventEmitter.emit("refreshConversations");
      hideSearch();
    }
  } catch (error) {
    console.error("Lỗi khi xử lý conversation:", error);
    Alert.alert("Lỗi", "Không thể tải danh sách conversation");
  }
};

  // const handleChatNavigation = async (selectedUser) => {
  //   try {
  //     const userJson = await AsyncStorage.getItem("user");
  //     const currentUser = JSON.parse(userJson);

  //     if (!currentUser) {
  //       Alert.alert("Lỗi", "Vui lòng đăng nhập lại!");
  //       return;
  //     }

  //     // Kiểm tra conversation đã tồn tại
  //     const sortedPhones = [currentUser.phoneNumber, selectedUser.phoneNumber].sort();
  //     const chatId = `${sortedPhones[0]}_${sortedPhones[1]}`;

  //     const checkRes = await fetch(
  //       `http://${BASE_URL}:3618/checkConversationExist`,
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({ chatId }),
  //       }
  //     );

  //     const checkData = await checkRes.json();
  //     let chatRoomId;

  //     if (checkData.exists) {
  //       // Nếu conversation đã tồn tại, sử dụng chatRoomId hiện có
  //       chatRoomId = checkData.chatRoomId;
  //       console.log('Sử dụng conversation có sẵn:', chatRoomId);
  //     } else {
  //       // Nếu chưa tồn tại, tạo mới
  //       chatRoomId = await createChatRoomAndConversation(
  //         currentUser.phoneNumber,
  //         selectedUser.phoneNumber
  //       );
  //       console.log('Đã tạo conversation mới:', chatRoomId);
  //     }

  //     if (chatRoomId) {
  //       navigation.navigate("chatting", {
  //         otherUser: selectedUser,
  //         chatRoom: chatRoomId,
  //         thisUser: currentUser,
  //       });
  //       hideSearch();
  //     }
  //   } catch (error) {
  //     console.error("Lỗi khi xử lý conversation:", error);
  //     Alert.alert("Lỗi", "Không thể truy cập cuộc trò chuyện");
  //   }
  // };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Vui lòng nhập tên nhóm");
      return;
    }

    if (!groupName.trim() || !/^(?! )[A-Za-zÀ-ỹ0-9 ]{3,50}$/.test(groupName)) {
      Alert.alert("Tên nhóm phải từ 3-50 kí tự, và không chứa ký tự đặt biệt");
      return;
    }

    if (newList.length < 2) {
      Alert.alert("Nhóm cần ít nhất 2 thành viên");
      return;
    }

    const groupData = {
      nameGroup: groupName,
      createdBy: currentUser.phoneNumber,
      participants: [...newList, currentUser.phoneNumber],
    };

    try {
      await createGroupChatRoom(groupData);
      Alert.alert("Tạo nhóm thành công!");

      // Reset và đóng modal
      setGroupName("");
      setNewList([]);
      setShowModalAdd(false);
    } catch (error) {
      console.error("Lỗi tạo nhóm:", error.message);
      Alert.alert("Lỗi", error.message || "Không thể tạo nhóm");
    }
  };


  const handleOpenModalAdd = () => {
    setShowModalAdd(true);
  };

  const handleCloseModalAdd = () => {
    setShowModalAdd(false);
  };

  const styles = getStyles(themeColors);

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <View style={{ backgroundColor: themeColors.background }}>
        <View style={styles.headerContainer}>
          <View style={styles.block}>
            <TextInput
              placeholder="Tìm kiếm"
              placeholderTextColor={"#fff"}
              style={styles.TextInputStyle}
              value={searchText}
              onChangeText={setSearchText}
              onPressIn={handleTextInputPress}
            />
            <TouchableOpacity style={styles.touch} onPress={handleSearch}>
              <AntDesign name="search1" size={30} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.touch} onPress={handleOpenModalAdd}>
              <AntDesign name="plus" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        {isSearchVisible && searchResults.length > 0 && (
          <View style={styles.searchResults}>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item?.phoneNumber || Math.random().toString()}
              renderItem={({ item }) => {
                if (!item || !item.fullName) {
                  return null; // Bỏ qua nếu dữ liệu không hợp lệ
                }

                return (
                  <View style={styles.searchResultItem}>
                    <TouchableOpacity
                      style={styles.userInfo}
                      onPress={() => handleChatNavigation(item)} // Gọi hàm handleChatNavigation
                    >
                      <Image
                        source={{ uri: item.avatar }}
                        style={styles.avatar}
                      />
                      <Text style={styles.text}>{item.fullName}</Text>
                    </TouchableOpacity>
                    {typeof item.isFriend === 'boolean' && !item.isFriend && (
                      <TouchableOpacity
                        style={styles.addFriendButton}
                        onPress={() => handleSendFriendRequest(item.phoneNumber)}
                      >
                        <Text style={styles.addFriendText}>Thêm bạn</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }}
            />
          </View>
        )}

        {/* modal tao nhom */}
        <Modal
          visible={showModalAdd}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCloseModalAdd}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: "85%",
                backgroundColor: themeColors.background,
                padding: 20,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  marginBottom: 10,
                  color: themeColors.text,
                }}
              >
                Tạo nhóm
              </Text>
              <TextInput
                placeholder="Nhập tên nhóm"
                placeholderTextColor="#aaa"
                value={groupName}
                onChangeText={setGroupName}
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 10,
                  padding: 10,
                  marginTop: 15,
                  color: themeColors.text,
                }}
              />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  marginVertical: 10,
                  color: themeColors.text,
                }}
              >
                Thêm Thành Viên
              </Text>
              <FlatList
                data={contacts}
                keyExtractor={(item) => item.phone}
                style={{ maxHeight: 200 }}
                renderItem={({ item }) => {
                  const isSelected = newList.includes(item.phone);
                  return (
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                        backgroundColor: isSelected
                          ? themeColors.primary
                          : "transparent",
                        padding: 8,
                        borderRadius: 10,
                      }}
                      onPress={() => handleAddMemberToNewList(item.phone)}
                    >
                      <Image
                        source={{ uri: item.avatar }}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          marginRight: 10,
                        }}
                      />
                      <Text style={{ color: themeColors.text }}>{item.name}</Text>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <Text style={{ color: themeColors.text }}>
                    Không có bạn nào để thêm
                  </Text>
                }
              />



              <TouchableOpacity
                style={{
                  marginTop: 10,
                  backgroundColor: "#2196F3",
                  padding: 10,
                  borderRadius: 10,
                }}
                onPress={handleCreateGroup}
              >
                <Text style={{ color: "#fff", textAlign: "center" }}>
                  Tạo nhóm
                </Text>
              </TouchableOpacity>


              <TouchableOpacity
                onPress={handleCloseModalAdd}
                style={{ marginTop: 20 }}
              >
                <Text style={{ color: "red", textAlign: "right" }}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
    </TouchableWithoutFeedback>
  );
};

const getStyles = (themeColors) =>
  StyleSheet.create({
    headerContainer: {
      height: 120,
      backgroundColor: themeColors.primary,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 30,
      borderBottomEndRadius: 30,
      borderBottomStartRadius: 30,
    },
    TextInputStyle: {
      height: 40,
      flex: 1,
      borderRadius: 10,
      paddingLeft: 20,
      borderColor: "#fff",
      borderWidth: 1,
      backgroundColor: "#7399C3",
      color: themeColors.text,
    },
    block: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
      paddingHorizontal: 20,
    },
    touch: {
      marginLeft: 15,
    },
    searchResults: {
      position: "absolute",
      top: 120,
      left: 0,
      right: 0,
      maxHeight: 200,
      backgroundColor: themeColors.background,
      borderBottomWidth: 1,
      borderBottomColor: "#ccc",
      zIndex: 1000,
    },
    searchResultItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#eee",
    },
    userInfo: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
    },
    text: {
      color: themeColors.text,
      fontSize: 16,
    },
    addFriendButton: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 5,
    },
    addFriendText: {
      color: "#fff",
      fontSize: 14,
    },
  });

export default Header;
