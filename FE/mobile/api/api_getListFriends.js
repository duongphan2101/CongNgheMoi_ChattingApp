// hooks/useFriends.js
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import getIp from "../utils/getIp_notPORT";

const BASE_URL = getIp();

function useFriends() {
  const [contacts, setContacts] = useState([]);

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

      if (!response.ok) {
        throw new Error('Lỗi khi lấy danh sách bạn bè!');
      }

      const data = await response.json();
      setContacts(data.map(friend => ({
        id: friend.phoneNumber,
        name: friend.fullName || 'Không rõ',
        avatar: friend.avatar || 'https://imgur.com/RLtzJy5.jpg',
        phone: friend.phoneNumber,
        status: 'offline',
      })));
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bạn bè:', error);
      Alert.alert("Lỗi", "Không thể lấy danh sách bạn bè!");
    }
  }, []);

  return { contacts, fetchFriends };
}

export default useFriends;
