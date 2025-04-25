import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from "../contexts/themeContext";
import colors from "../themeColors";
import getUserbySearch from "../api/api_searchUSer";
import { useSearch } from '../contexts/searchContext';
import getIp from '../utils/getIp_notPORT';

const BASE_URL = getIp();

const Header = ({ navigation }) => {
  const { theme, toggleTheme } = useTheme();
  const themeColors = colors[theme];
  const [searchText, setSearchText] = useState('');
  const { isSearchVisible, setIsSearchVisible, searchResults, setSearchResults, hideSearch } = useSearch();

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

  const handleSendFriendRequest = async (receiverPhone) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập để gửi yêu cầu kết bạn!");
        return;
      }

      const response = await fetch(`http://${BASE_URL}:3824/user/sendFriendRequest`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receiverPhone }),
      });

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
              placeholder='Tìm kiếm' 
              placeholderTextColor={'#fff'} 
              style={styles.TextInputStyle}
              value={searchText}
              onChangeText={setSearchText}
              onPressIn={handleTextInputPress}
            />
            <TouchableOpacity style={styles.touch} onPress={handleSearch}>
              <AntDesign name='search1' size={30} color='#fff'/>
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

const getStyles = (themeColors) => StyleSheet.create({
  headerContainer: {
    height: 120,
    backgroundColor: themeColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  TextInputStyle: {
    height: 40,
    flex: 1,
    borderRadius: 10,
    paddingLeft: 20,
    borderColor: '#fff',
    borderWidth: 1,
    backgroundColor: '#7399C3',
    color: themeColors.text,
  }, 
  block: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20
  },
  touch: {
    marginLeft: 15
  },
  searchResults: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    maxHeight: 200,
    backgroundColor: themeColors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    zIndex: 1000,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#fff',
    fontSize: 14,
  }
});

export default Header;
