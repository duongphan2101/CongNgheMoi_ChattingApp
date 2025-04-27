import { StyleSheet, Text, View, Image, TouchableOpacity, FlatList } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useTheme } from "../contexts/themeContext";
import colors from "../themeColors";
import getConversations from "../api/api_getConversation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import getUserbySearch from "../api/api_searchUSer";
import { useSearch } from '../contexts/searchContext';
import { useFocusEffect } from '@react-navigation/native';
import io from "socket.io-client";
import getIp from "../utils/getIp_notPORT";


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

    // Lắng nghe khi có conversation mới được tạo
    socket.on('newConversation', async (data) => {
      // Kiểm tra xem user hiện tại có trong conversation không
      if (data.participants.includes(thisUser.phoneNumber)) {
        await fetchData(); // Load lại toàn bộ danh sách
      }
    });

    // Lắng nghe khi có nhóm mới được tạo
    socket.on('groupCreated', async (data) => {
      if (data.participants.includes(thisUser.phoneNumber)) {
        console.log(`Nhóm mới được tạo: ${data.nameGroup}`);
        await fetchData(); // Load lại toàn bộ danh sách
      }
    });

    return () => {
      socket.off('newConversation');
      socket.off('groupCreated');
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
    <View style={styles.container}>
      <View style={styles.listChattingUsers}>
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.chatId.toString()}
          renderItem={({ item }) => {
            const otherPhone = item.participants.find(
              (phone) => phone !== currentUserPhone
            );
            const otherUser = usersInfo[otherPhone];
            // Format hiển thị thời gian tin nhắn cuối cùng
            let lastMessageDisplay = item.lastMessage || "Chưa có tin nhắn nào";

            // Định dạng thời gian nếu cần
            // let lastMessageTime = '';
            // if (item.lastMessageTime) {
            //   const date = new Date(item.lastMessageTime);
            //   lastMessageTime = `${date.getHours()}:${date.getMinutes()}`;
            // }

            return (
              <TouchableOpacity
                style={styles.user}
                onPress={() => navigation.navigate('chatting', { otherUser: otherUser, chatRoom: item, thisUser: thisUser })}
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
                {/* <Text style={styles.time}>{lastMessageTime}</Text> */}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
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
  },
  user: {
    paddingHorizontal: 10,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flexDirection: 'row',
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
  }
});