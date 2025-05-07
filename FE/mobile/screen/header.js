import React, { useState } from "react";
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
} from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from '@react-navigation/native';

import { useTheme } from "../contexts/themeContext";
import colors from "../themeColors";
import getUserbySearch from "../api/api_searchUSer";
import { useSearch } from "../contexts/searchContext";
import getIp from "../utils/getIp_notPORT";

const BASE_URL = getIp();

const Header = ({}) => {
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
  const [currentUser, setCurrentUser] = useState(null);

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
          // Sử dụng hàm checkFriendshipStatus thay vì gọi API trực tiếp
          const resultsWithFriendStatus = await Promise.all(
            result.map(async (user) => {
              const isFriend = await checkFriendshipStatus(user.phoneNumber);
              console.log('Friendship status for', user.fullName, ':', isFriend);
              return { ...user, isFriend };
            })
          );

          console.log('Search results with friendship status:', resultsWithFriendStatus);
          setSearchResults(resultsWithFriendStatus);
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
      const userJson = await AsyncStorage.getItem("user");
      const currentUser = JSON.parse(userJson);

      if (!currentUser) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập lại!");
        return;
      }

      // Kiểm tra conversation đã tồn tại
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
        // Nếu conversation đã tồn tại, sử dụng chatRoomId hiện có
        chatRoomId = checkData.chatRoomId;
        console.log('Sử dụng conversation có sẵn:', chatRoomId);
      } else {
        // Nếu chưa tồn tại, tạo mới
        chatRoomId = await createChatRoomAndConversation(
          currentUser.phoneNumber,
          selectedUser.phoneNumber
        );
        console.log('Đã tạo conversation mới:', chatRoomId);
      }

      if (chatRoomId) {
        navigation.navigate("chatting", {
          otherUser: selectedUser,
          chatRoom: chatRoomId,
          thisUser: currentUser,
        });
        hideSearch();
      }
    } catch (error) {
      console.error("Lỗi khi xử lý conversation:", error);
      Alert.alert("Lỗi", "Không thể truy cập cuộc trò chuyện");
    }
  };

  const styles = getStyles(themeColors);

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <View style={{backgroundColor: themeColors.background}}>
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
          </View>
        </View>
        {isSearchVisible && searchResults.length > 0 && (
          <View style={styles.searchResults}>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.phoneNumber}
              renderItem={({ item }) => (
                <View style={styles.searchResultItem}>
                  <TouchableOpacity
                    style={styles.userInfo}
                    onPress={() => {
                      navigation.navigate('chatting', { otherUser: item, chatRoom: null });
                      hideSearch();
                    }}
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
              )}
            />
          </View>
        )}
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
      paddingTop: 40,
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
