import { StyleSheet, Text, View, Image, TouchableOpacity, FlatList, TouchableWithoutFeedback, Keyboard } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useTheme } from "../contexts/themeContext";
import colors from "../themeColors";
import getConversations from "../api/api_getConversation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import getUserbySearch from "../api/api_searchUSer";
import { useSearch } from '../contexts/searchContext';
import { useFocusEffect } from '@react-navigation/native';

export default function App({ navigation }) {
  const { theme } = useTheme();
  const themeColors = colors[theme];
  const [conversations, setConversations] = useState([]);
  const [currentUserPhone, setCurrentUserPhone] = useState(null);
  const [usersInfo, setUsersInfo] = useState({}); // lưu user theo số điện thoại
  const [thisUser, setThisUser] = useState()
  const { hideSearch } = useSearch();

  useFocusEffect(
    React.useCallback(() => {
      hideSearch();
    }, [])
  );

  useEffect(() => {
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
          // Thêm lastMessageTime để có thể so sánh khi tin nhắn bị thu hồi
          const conversationsWithTime = data.map(conv => ({
            ...conv,
            lastMessageTime: conv.lastMessageTime || Date.now()
          }));
          setConversations(conversationsWithTime);

          if (socket) {
            conversationsWithTime.forEach(conv => {
              socket.emit("joinRoom", conv.chatRoomId);
            });
          }

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

    fetchData();
  }, [socket]);

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
    <TouchableWithoutFeedback onPress={handleScreenPress}>
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

              return (
                <TouchableOpacity
                  style={styles.user}
                  onPress={() => handlePress(otherUser, item.chatRoomId)}
                >
                  <Image
                    source={{
                      uri: otherUser?.avatar,
                    }}
                    style={styles.avatar}
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.text}>{otherUser?.fullName || 'Đang tải...'}</Text>
                    <Text style={styles.mess}>{item.lastMessage}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
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
