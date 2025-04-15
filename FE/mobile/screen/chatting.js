import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useTheme } from "../contexts/themeContext";
import colors from "../themeColors";
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import io from "socket.io-client";
import getIp from "../utils/getIp_notPORT"
import Entypo from '@expo/vector-icons/Entypo';
import moment from 'moment';
import getUserbySearch from '../api/api_searchUSer';
import { showLocalNotification } from "../utils/notifications";
import deleteMessage from '../api/api_deleteMessage';

const BASE_URL = getIp();
const socket = io(`http://${BASE_URL}:3618`);
const notificationSocket = io(`http://${BASE_URL}:3515`);

export default function App({ navigation, route }) {
  const { theme } = useTheme();
  const themeColors = colors[theme];

  const otherUser = route.params.otherUser;
  const chatRoomId = route.params.chatRoom;
  const thisUser = route.params.thisUser;
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [currentUserPhone, setCurrentUserPhone] = useState()
  const flatListRef = useRef();
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageOptions, setShowMessageOptions] = useState(false);

  useEffect(() => {
    if (!chatRoomId || !thisUser?.phoneNumber) return;

    setCurrentUserPhone(thisUser.phoneNumber);

    const fetchMessages = async () => {
      try {
        const res = await fetch(`http://${BASE_URL}:3618/messages?chatRoomId=${chatRoomId}`);
        const data = await res.json();

        if (Array.isArray(data)) {
          setMessages(data);
        } else {
          console.warn("Dữ liệu không phải mảng:", data);
        }
      } catch (err) {
        console.error("Lỗi khi lấy tin nhắn:", err);
        Alert.alert("Lỗi", "Không thể tải tin nhắn");
      }
    };

    fetchMessages();

    // Join room
    socket.emit("joinRoom", chatRoomId);

    const handleReceiveMessage = (newMessage) => {
      console.log("Tin nhắn mới:", newMessage);
      setMessages((prev) => [...prev, newMessage]);
    };

    const handleTyping = () => setTyping(true);
    const handleStopTyping = () => setTyping(false);

    const handleDeleteMessage = ({ messageId }) => {
      setMessages((prev) => prev.filter(msg => msg.timestamp !== messageId));
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("userTyping", handleTyping);
    socket.on("userStopTyping", handleStopTyping);
    socket.on("messageDeleted", handleDeleteMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("userTyping", handleTyping);
      socket.off("userStopTyping", handleStopTyping);
      socket.off("messageDeleted", handleDeleteMessage);
    };
  }, [chatRoomId, thisUser?.phoneNumber]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const newMsg = {
      chatRoomId: chatRoomId,
      sender: currentUserPhone,
      receiver: otherUser.phoneNumber,
      message: message,
      timestamp: Date.now(),
      type: "text",
    };

    setMessage("");

    try {
      const response = await fetch(`http://${BASE_URL}:3618/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMsg),
      });

      if (!response.ok) throw new Error("Gửi tin nhắn thất bại!");

      // Cập nhật lastMessage trong danh sách userChatList
      // updateLastMessage(currentUserPhone, otherUserPhone, newMsg.message);
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      Alert.alert("Lỗi", "Không thể gửi tin nhắn. Vui lòng thử lại sau.");
    }
  };

  // Hàm xử lý xóa tin nhắn
  const handleDeleteMessagePress = async () => {
    if (!selectedMessage) return;
    
    try {
      await deleteMessage(chatRoomId, selectedMessage.timestamp);
      // Tin nhắn sẽ được cập nhật thông qua socket
      setShowMessageOptions(false);
      setSelectedMessage(null);
    } catch (error) {
      console.error("Lỗi xóa tin nhắn:", error);
      Alert.alert("Lỗi", "Không thể xóa tin nhắn. Vui lòng thử lại sau.");
    }
  };

  const handleLongPressMessage = (item) => {
    if (item.sender === thisUser.phoneNumber) {
      setSelectedMessage(item);
      setShowMessageOptions(true);
    }
  };

  useEffect(() => {
    if (!thisUser?.phoneNumber) return;

    notificationSocket.emit("join", thisUser.phoneNumber);

    notificationSocket.on("notification", async (data) => {
      try {
        let senderName = "Không rõ";
        const senderInfo = await getUserbySearch(data.from, data.from);
        if (senderInfo?.[0]?.fullName) senderName = senderInfo[0].fullName;

        let message = "";
        switch (data.type) {
          case "new_message":
            message = `Tin nhắn từ ${senderName}: ${data.message}`;
            break;
          case "file":
            message = `Bạn nhận được một file từ ${senderName}`;
            break;
          case "audio":
            message = `Bạn nhận được tin nhắn thoại từ ${senderName}`;
            break;
          default:
            message = `Thông báo mới từ ${senderName}`;
        }

        showLocalNotification("VChat", message);
      } catch (err) {
        console.error("Lỗi thông báo:", err);
      }
    });

    return () => {
      notificationSocket.off("notification");
    };
  }, [thisUser?.phoneNumber]);


  const styles = getStyles(themeColors);
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.head}>
          <View style={styles.user}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>
              <Image source={{ uri: otherUser.avatar }} style={styles.avatar} />
              <Text style={styles.name}>{otherUser.fullName}</Text>
            </View>
          </View>
        </View>

        {/* Chat content */}
        <FlatList
          ref={flatListRef}
          style={styles.content}
          data={messages}
          keyExtractor={(item, index) => index.toString()}
          onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.userChatting,
                { justifyContent: item.sender === thisUser.phoneNumber ? 'flex-end' : 'flex-start' }
              ]}
              onLongPress={() => handleLongPressMessage(item)}
              delayLongPress={500}
            >
              {item.sender !== thisUser.phoneNumber && (
                <Image source={{ uri: otherUser.avatar }} style={{ height: 50, width: 50, marginTop: 15, borderRadius: 50 }} />
              )}
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: themeColors.text, fontSize: 10 }}>
                  {moment(item.timestamp).format('HH:mm dd/MM/YY')}
                </Text>
                <View
                  style={[
                    styles.blockChat,
                    {
                      backgroundColor: item.sender === thisUser.phoneNumber ? '#6fd39f' : '#8bb9f2',
                      borderRadius: 15,
                      padding: 10
                    },
                  ]}
                >
                  <Text style={{
                    color: '#fff', maxWidth: '90%',
                    flexWrap: 'wrap'
                  }}>{item.message}</Text>
                </View>
              </View>
              {item.sender === thisUser.phoneNumber && (
                <Image source={{ uri: thisUser.avatar }} style={{ height: 50, width: 50, marginTop: 15, borderRadius: 50 }} />
              )}
            </TouchableOpacity>
          )}
        />

        {/* message + Gửi */}
        <View style={styles.bottomtab}>
          <TouchableOpacity style={styles.touch}>
            <Ionicons name="image" size={30} color={themeColors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.touch}>
            <Entypo name="emoji-flirt" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.touch}>
            <Ionicons name="mic" size={30} color={themeColors.text} />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Nhập nội dung ..."
            placeholderTextColor="#ccc"
            value={message}
            onChangeText={setMessage}
          />
          <TouchableOpacity style={styles.touch} onPress={handleSendMessage} disabled={!message.trim()}>
            <Ionicons name="send" size={30} color={themeColors.text} />
          </TouchableOpacity>
        </View>

        {/* Modal tùy chọn tin nhắn */}
        <Modal
          transparent={true}
          visible={showMessageOptions}
          animationType="fade"
          onRequestClose={() => setShowMessageOptions(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowMessageOptions(false)}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.modalOption}
                onPress={handleDeleteMessagePress}
              >
                <MaterialIcons name="delete" size={24} color="red" />
                <Text style={styles.modalOptionText}>Xóa tin nhắn</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalOption}
                onPress={() => setShowMessageOptions(false)}
              >
                <MaterialIcons name="cancel" size={24} color={themeColors.text} />
                <Text style={styles.modalOptionText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (themeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  head: {
    width: '100%',
    backgroundColor: themeColors.primary,
    height: 100,
    paddingTop: 40,
    paddingHorizontal: 20
  },
  user: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  avatar: {
    width: 55,
    height: 55,
    marginLeft: 10,
  },
  name: {
    fontSize: 24,
    color: '#fff',
    paddingHorizontal: 20,
    fontWeight: 'bold'
  },
  content: {
    flex: 1,
  },
  bottomtab: {
    height: 100,
    backgroundColor: themeColors.primary,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  textInput: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    paddingLeft: 20,
    marginHorizontal: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    color: themeColors.text
  },
  contextChat: {
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  userChatting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'start',
    padding: 5
  },
  blockChat: {
    backgroundColor: '#7399C3',
    padding: 15,
    borderRadius: 20,
  },
  touch: {
    marginHorizontal: 5
  },
  // Style cho modal
  modalOverlay: {
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '80%',
    backgroundColor: themeColors.background,
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 10,
    color: themeColors.text
  }
});