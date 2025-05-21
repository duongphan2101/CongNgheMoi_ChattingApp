import { StyleSheet, Text, View, Image, TouchableOpacity, FlatList, TouchableWithoutFeedback, Keyboard, Alert, TextInput } from 'react-native';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from "../contexts/themeContext";
import colors from "../themeColors";
import AsyncStorage from '@react-native-async-storage/async-storage';
import getIp from '../utils/getIp_notPORT';
import { useSearch } from '../contexts/searchContext';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import io from "socket.io-client";
import eventEmitter from "../utils/EventEmitter";
const BASE_URL = getIp();

const socket = io(`http://${BASE_URL}:3824`);

export default function App({ navigation }) {
  const { theme, toggleTheme } = useTheme();
  const themeColors = colors[theme];
  const [contacts, setContacts] = useState([]);
  const [thisUser, setThisUser] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  const { hideSearch } = useSearch();
  const [searchTerm, setSearchTerm] = useState('');
  const fetchFriendsIntervalRef = useRef(null);
  const fetchFriendRequestsIntervalRef = useRef(null);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchFriends = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert("Lỗi", "Không tìm thấy token!");
        return;
      }

      const response = await fetch(`http://${BASE_URL}:3824/user/friends`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // if (!response.ok) {
      //   throw new Error('Lỗi khi lấy danh sách bạn bè!');
      // }

      const data = await response.json();
      const updatedContacts = data.map(friend => ({
        id: friend.phoneNumber,
        name: friend.fullName || 'Không rõ',
        avatar: friend.avatar || 'https://imgur.com/RLtzJy5.jpg',
        phone: friend.phoneNumber,
        status: 'offline'
      }));

      // Cập nhật danh sách bạn bè
      setContacts(updatedContacts);
    } catch (error) {
      setContacts([]); // Đảm bảo danh sách được làm mới thành mảng rỗng nếu có lỗi
    }
  }, []);

  const fetchFriendRequests = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert("Lỗi", "Không tìm thấy token!");
        return;
      }

      const response = await fetch(`http://${BASE_URL}:3824/user/friendRequests`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Lỗi khi lấy danh sách lời mời kết bạn!');
      }

      const data = await response.json();

      // Kiểm tra nếu có lời mời mới
      // if (data.length > friendRequests.length) {
      //   Alert.alert("Thông báo", "Bạn có lời mời kết bạn mới!");
      // }

      setFriendRequests(data);
    } catch (error) {
    }
  }, [friendRequests.length]);

  const handleAcceptFriendRequest = async (requestId) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập!");
        return;
      }

      const response = await axios.post(
        `http://${BASE_URL}:3824/user/acceptFriendRequest`,
        { requestId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.message === "Chấp nhận yêu cầu kết bạn thành công!") {
        // Cập nhật UI
        setFriendRequests((prevRequests) =>
          prevRequests.filter((request) => request.RequestId !== requestId)
        );
        fetchFriends(); // Load lại danh sách bạn bè
      }
    } catch (error) {
      console.error("Lỗi chấp nhận lời mời kết bạn:", error);
    }
  };

  const handleRejectFriendRequest = async (requestId) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập!");
        return;
      }

      const response = await axios.post(
        `http://${BASE_URL}:3824/user/rejectFriendRequest`,
        { requestId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.message === "Đã từ chối yêu cầu kết bạn!") {
        // Cập nhật UI
        setFriendRequests((prevRequests) =>
          prevRequests.filter((request) => request.RequestId !== requestId)
        );
        Alert.alert("Thành công", "Đã từ chối lời mời kết bạn!");
      }
    } catch (error) {
      console.error("Lỗi từ chối lời mời kết bạn:", error);
      Alert.alert("Lỗi", "Không thể từ chối lời mời kết bạn!");
    }
  };

  const handleUnfriend = async (friendPhone) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập!");
        return;
      }

      const response = await axios.post(
        `http://${BASE_URL}:3824/user/unfriend`,
        { friendPhone },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.message === "Đã hủy kết bạn thành công!") {
        // Cập nhật danh sách bạn bè
        const updatedContacts = contacts.filter((contact) => contact.phone !== friendPhone);
        setContacts(updatedContacts);

        // Nếu danh sách bạn bè rỗng, đồng bộ lại từ server
        if (updatedContacts.length === 0) {
          await fetchFriends();
        }

        Alert.alert("Thành công", "Đã hủy kết bạn!");
      }
    } catch (error) {
      console.error("Lỗi hủy kết bạn:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      Alert.alert("Lỗi", "Không thể hủy kết bạn! Vui lòng thử lại sau.");
    }
  };

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : null;
        setThisUser(user);
      } catch (error) {
      }
    };

    getUserInfo();
    fetchFriends();
    fetchFriendRequests();
  }, []);

  useEffect(() => {
    // Bắt đầu polling
    fetchFriendsIntervalRef.current = setInterval(() => {
      fetchFriends();
    }, 1000); // Poll every 1 second

    fetchFriendRequestsIntervalRef.current = setInterval(() => {
      fetchFriendRequests();
    }, 2000); // Poll every 2 seconds

    // Lắng nghe sự kiện đăng xuất
    const handleLogout = () => {
      clearInterval(fetchFriendsIntervalRef.current);
      clearInterval(fetchFriendRequestsIntervalRef.current);
    };

    eventEmitter.on("logout", handleLogout);

    // Cleanup khi component unmount
    return () => {
      clearInterval(fetchFriendsIntervalRef.current);
      clearInterval(fetchFriendRequestsIntervalRef.current);
      eventEmitter.off("logout", handleLogout);
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      hideSearch();
    }, [])
  );

  const handleScreenPress = () => {
    hideSearch();
    Keyboard.dismiss();
  };

  const styles = getStyles(themeColors);

  const renderContact = ({ item }) => (
    <View style={styles.contactItemContainer}>
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => navigation.navigate('router', {
          screen: 'chatScr',
          params: {
            otherUser: item,
            thisUser: thisUser
          }
        })}
      >
        <View style={styles.avatarContainer}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          <View style={[
            styles.statusIndicator,
            { backgroundColor: item.status === 'online' ? '#4CAF50' : '#757575' }
          ]} />
        </View>

        <View style={styles.contactInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.phone}>{item.phone}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.unfriendButton}
        onPress={() => handleUnfriend(item.phone)}
      >
        <Text style={styles.unfriendButtonText}>Hủy kết bạn</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFriendRequest = ({ item }) => (
    <View style={styles.friendRequestItem}>
      <View style={styles.friendRequestInfo}>
        <Text style={styles.friendRequestText}>Lời mời kết bạn từ: {item.senderPhone}</Text>
      </View>
      <View style={styles.friendRequestActions}>
        <TouchableOpacity
          style={[styles.friendRequestButton, styles.acceptButton]}
          onPress={() => handleAcceptFriendRequest(item.RequestId)}
        >
          <Text style={styles.buttonText}>Chấp nhận</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.friendRequestButton, styles.rejectButton]}
          onPress={() => handleRejectFriendRequest(item.RequestId)}
        >
          <Text style={styles.buttonText}>Từ chối</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={handleScreenPress}>
      <View style={styles.container}>
        {friendRequests.length > 0 && (
          <View style={styles.friendRequestsSection}>
            <Text style={styles.sectionTitle}>Lời mời kết bạn</Text>
            <FlatList
              data={friendRequests}
              keyExtractor={(item) => item.RequestId}
              renderItem={renderFriendRequest}
            />
          </View>
        )}

        <View style={styles.contactsSection}>
          <Text style={styles.sectionTitle}>Danh sách bạn bè</Text>
          {/* Ô tìm kiếm với icon */}
          <View style={{ position: 'relative', justifyContent: 'center' }}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm bạn bè..."
              placeholderTextColor="#888"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id}
            renderItem={renderContact}
          />
        </View>

        {/* <View style={styles.contactsSection}>
          <Text style={styles.sectionTitle}>Danh sách bạn bè</Text>
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id}
            renderItem={renderContact}
          />
        </View> */}
      </View>
    </TouchableWithoutFeedback>
  );
}

const getStyles = (themeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  friendRequestsSection: {
    marginBottom: 20,
  },
  contactsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeColors.text,
    marginVertical: 10,
    marginHorizontal: 15,
  },
  friendRequestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: themeColors.background,
  },
  friendRequestInfo: {
    flex: 1,
  },
  friendRequestText: {
    color: themeColors.text,
    fontSize: 16,
  },
  friendRequestActions: {
    flexDirection: 'row',
  },
  friendRequestButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
  contactItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: themeColors.background,
  },
  contactItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: themeColors.background,
  },
  contactInfo: {
    marginLeft: 15,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: themeColors.text,
  },
  phone: {
    fontSize: 14,
    color: '#666',
  },
  unfriendButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  unfriendButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  searchInput: {
    backgroundColor: '#f5f6fa',
    borderRadius: 20,
    paddingHorizontal: 40,
    paddingVertical: 10,
    marginHorizontal: 15,
    marginBottom: 15,
    color: '#222',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    position: 'absolute',
    left: 28,
    top: 13,
    zIndex: 1,
    color: '#888',
    fontSize: 18,
  },
});