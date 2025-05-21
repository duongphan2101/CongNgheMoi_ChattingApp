import { StyleSheet, Text, View, Image, TouchableOpacity, FlatList, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useTheme } from "../contexts/themeContext";
import { SwipeListView } from 'react-native-swipe-list-view';
import colors from "../themeColors";
import Icon from 'react-native-vector-icons/FontAwesome';
import getConversations from "../api/api_getConversation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import getUserbySearch from "../api/api_searchUSer";
import { useSearch } from '../contexts/searchContext';
import { useFocusEffect } from '@react-navigation/native';
import io from "socket.io-client";
import getIp from "../utils/getIp_notPORT";
import eventEmitter from "../utils/EventEmitter";

const BASE_URL = getIp();
const socket = io(`http://${BASE_URL}:3618`);

export default function App({ navigation, route }) {
  const { theme } = useTheme();
  const themeColors = colors[theme];
  const [conversations, setConversations] = useState([]);
  const [currentUserPhone, setCurrentUserPhone] = useState(null);
  const [usersInfo, setUsersInfo] = useState({}); // lưu user theo số điện thoại
  const [thisUser, setThisUser] = useState();
  const { hideSearch } = useSearch(); // Lấy hàm hideSearch từ đối tượng trả về
  const [selectedChatRoomId, setSelectedChatRoomId] = useState(null);

  const fetchData = async () => {
    try {
      const userJson = await AsyncStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      setThisUser(user);
      if (!user || !user.phoneNumber) {
        console.error("Không tìm thấy thông tin user hoặc số điện thoại!");
        return;
      }

      setCurrentUserPhone(user.phoneNumber);
      const data = await getConversations();
      if (data) {
        setConversations(data);

        const phonesToFetch = data.map(c => c.participants.find(p => p !== user.phoneNumber));
        const uniquePhones = [...new Set(phonesToFetch)];
        const fetchedUsers = {};

        for (const phone of uniquePhones) {
          const result = await getUserbySearch(phone, phone);
          if (result && result.length > 0) {
            fetchedUsers[phone] = result[0];
          }
        }

        setUsersInfo(fetchedUsers);
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
    }
  };

  // Lắng nghe socket cho conversation mới
  useEffect(() => {
    if (!thisUser?.phoneNumber) return;

    // Join socket với số điện thoại của user
    socket.emit('joinUser', thisUser.phoneNumber);

    // Lắng nghe khi có conversation mới được tạo
    socket.on('newConversation', async (data) => {
      // Kiểm tra xem user hiện tại có trong conversation không
      if (data.participants.includes(thisUser.phoneNumber)) {
        await fetchData(); // Load lại toàn bộ danh sách
      }
    });

    return () => {
      socket.off('newConversation');
    };
  }, [thisUser?.phoneNumber]);

  const updateConversationWithNewMessage = (newMessage) => {
    setConversations(prevConversations => {
      return prevConversations.map(conv => {
        if (conv.chatRoomId === newMessage.chatRoomId) {
          return {
            ...conv,
            lastMessage: newMessage.type === "text" ? newMessage.message :
              newMessage.type === "audio" ? "[Tin nhắn thoại]" :
                newMessage.type === "file" ? "[File đính kèm]" : "[Tin nhắn]",
            lastMessageTime: newMessage.timestamp
          };
        }
        return conv;
      });
    });
  };

  const updateConversationWithRevokedMessage = (revokedMessage) => {
    setConversations(prevConversations => {
      return prevConversations.map(conv => {
        // Chỉ cập nhật nếu tin nhắn bị thu hồi là tin nhắn cuối cùng
        // Để làm điều này cần so sánh timestamp
        if (conv.chatRoomId === revokedMessage.chatRoomId &&
          conv.lastMessageTime === revokedMessage.timestamp) {
          return {
            ...conv,
            lastMessage: "[Tin nhắn đã bị thu hồi]"
          };
        }
        return conv;
      });
    });
  };

  const handleDeleteConversation = async (chatRoomId) => {
    try {
      const userJson = await AsyncStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      if (!user || !user.phoneNumber) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng!");
        return;
      }

      const response = await fetch(
        `http://${BASE_URL}:3618/deleteConversation/${chatRoomId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userPhone: user.phoneNumber,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Xóa hội thoại thất bại");
      }

      // Load lại danh sách hội thoại giống khi đăng nhập
      await fetchData();

      setConversations(prev => prev.filter(conv => conv.chatRoomId !== chatRoomId));

      Alert.alert("Thành công", "Đã xóa hội thoại!");
    } catch (error) {
      console.error("Lỗi khi xóa hội thoại:", error);
      Alert.alert("Lỗi", "Không thể xóa hội thoại!");
    }
  };

  useEffect(() => {
    if (route.params?.refresh) {
      fetchData();
    }
  }, [route.params?.refresh, route.params?.timestamp]);

  // Lắng nghe socket cho conversation mới
  useEffect(() => {
    if (!thisUser?.phoneNumber) return;

    // Join socket với số điện thoại của user
    socket.emit('joinUser', thisUser.phoneNumber);

    // Lắng nghe khi có nhóm mới được tạo
    socket.on('groupCreated', al);

    const al = async (data) => {
      if (data.participants.includes(thisUser.phoneNumber)) {
        // console.log(`Nhóm mới được tạo: ${data.groupName}`);
        await fetchData();
      }
    }

    socket.on("groupAvatarUpdated", al);

    socket.on('newChatRoom', al);

    socket.on('newChatRoom_Private', al)

    socket.on("updateChatRoom", al);

    return () => {
      socket.off('groupCreated');
      socket.off('newChatRoom', al);
      socket.off('updateChatRoom', al);
      socket.off('groupAvatarUpdated', al);
      socket.on('newChatRoom_Private', al);
    };
  }, [thisUser?.phoneNumber]);

  // Vẫn giữ useFocusEffect để load lại khi focus vào màn hình
  useFocusEffect(
    React.useCallback(() => {
      fetchData();
      hideSearch();
    }, [])
  );

  useEffect(() => {
    if (route.params?.refresh) {
      fetchData();
    }
  }, [route.params?.refresh, route.params?.timestamp]);

  // useEffect(() => {
  //   // Lắng nghe sự kiện "refreshConversations"
  //   const listener = eventEmitter.on("refreshConversations", () => {
  //     fetchData();
  //   });

  //   // Cleanup listener khi component unmount
  //   return () => {
  //     listener.remove();
  //   };
  // }, []);

  useEffect(() => {
    // Lắng nghe sự kiện "refreshConversations"
    const handler = () => {
      fetchData();
    };
    eventEmitter.on("refreshConversations", handler);

    // Cleanup listener khi component unmount
    return () => {
      eventEmitter.off("refreshConversations", handler);
    };
  }, []);

  const handlePress = (otherUser, chatRoom) => {
    hideSearch();
    navigation.navigate('chatting', { otherUser, chatRoom, thisUser });
  };

  const handleScreenPress = () => {
    hideSearch();
    Keyboard.dismiss();
  };

  const styles = getStyles(themeColors);

  return (
    <TouchableWithoutFeedback onPress={() => setSelectedChatRoomId(null)}>
      <View style={styles.container}>
        <View style={styles.listChattingUsers}>
          <SwipeListView
            data={conversations}
            keyExtractor={(item) => item.chatId.toString()}
            renderItem={({ item }) => {
              const otherPhone = item.participants.find(
                (phone) => phone !== currentUserPhone
              );
              const otherUser = usersInfo[otherPhone];
              let lastMessageDisplay = item.lastMessage || "Chưa có tin nhắn nào";

              return (
                <TouchableOpacity
                  style={styles.user}
                  onPress={() => navigation.navigate('chatting', { otherUser: otherUser, chatRoom: item, thisUser: thisUser })}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{
                      uri: item.isGroup ? item.avatar : otherUser?.avatar,
                    }}
                    style={styles.avatar}
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.text}>{item.isGroup ? item.fullName : otherUser?.fullName || 'Đang tải...'}</Text>
                    <Text style={styles.mess} numberOfLines={1} ellipsizeMode="tail">
                      {lastMessageDisplay}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            renderHiddenItem={({ item }) => (
              <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', backgroundColor: themeColors.background }}>
                <TouchableOpacity
                  style={styles.deleteIconContainer}
                  onPress={() => handleDeleteConversation(item.chatRoomId)}
                >
                  <Icon name="trash" size={28} color="red" style={styles.deleteIcon} />
                </TouchableOpacity>
              </View>
            )}
            rightOpenValue={-75}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const getStyles = (themeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listChattingUsers: {
    flex: 1,
    width: '100%',
  },
  avatar: {
    width: 60,
    height: 60,
    marginRight: 10,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: themeColors.text
  },
  user: {
    paddingHorizontal: 10,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flexDirection: 'row',
    width: '100%', // Thêm dòng này
    backgroundColor: themeColors.background, // Thêm dòng này
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: themeColors.text,
  },
  mess: {
    color: themeColors.text,
    flex: 1,
  },
  userInfo: {
    justifyContent: 'center',
    flex: 1,
  },
  time: {
    color: themeColors.text,
    fontSize: 12,
    alignSelf: 'flex-start',
    marginTop: 5
  },
  deleteIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  deleteIcon: {
    fontSize: 24,
    color: 'red',
  },
});