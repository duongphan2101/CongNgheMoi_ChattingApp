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

  const handleSearch = async () => {
    if (searchText.length > 0) {
      try {
        const result = await getUserbySearch(searchText, searchText);
        setSearchResults(result || []);
        setIsSearchVisible(true);
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

      await fetch(`http://${BASE_URL}:3618/createConversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(conversationData),
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
                    onPress={async () => {
                      try {
                        const userJson = await AsyncStorage.getItem("user");
                        const currentUser = JSON.parse(userJson);

                        if (!currentUser) {
                          Alert.alert("Lỗi", "Vui lòng đăng nhập lại!");
                          return;
                        }

                        const chatRoomId = await createChatRoomAndConversation(
                          currentUser.phoneNumber,
                          item.phoneNumber
                        );

                        if (chatRoomId) {
                          navigation.navigate("chatting", {
                            otherUser: item,
                            chatRoom: chatRoomId,
                            thisUser: currentUser,
                          });
                          hideSearch();
                        }
                      } catch (error) {
                        console.error("Lỗi khi tạo cuộc trò chuyện:", error);
                        Alert.alert("Lỗi", "Không thể tạo cuộc trò chuyện");
                      }
                    }}
                  >
                    <Image
                      source={{ uri: item.avatar }}
                      style={styles.avatar}
                    />
                    <Text style={styles.text}>{item.fullName}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addFriendButton}
                    onPress={() => handleSendFriendRequest(item.phoneNumber)}
                  >
                    <Text style={styles.addFriendText}>Thêm bạn</Text>
                  </TouchableOpacity>
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
