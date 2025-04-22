import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useTheme } from "../contexts/themeContext";
import colors from "../themeColors";
import getUser from '../api/api_getUser';
import updateUserInfo from '../api/api_updateUserInfo';
import updateUserAvatar from '../api/api_updateUserAvatar';
import DateTimePickerModal from "react-native-modal-datetime-picker";

export default function ProfileScreen({ navigation }) {
  const { theme } = useTheme();
  const themeColors = colors[theme];
  const styles = getStyles(themeColors);

  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [editInfo, setEditInfo] = useState({
    fullName: '',
    gender: '',
    day: '',
    month: '',
    year: '',
    dob: '',
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const currentDate = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate()
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getUser();
        if (userData) {
          setUserInfo(userData);
          
          const editData = { ...userData };
          if (userData.dob) {
            const [year, month, day] = userData.dob.split("-");
            editData.year = parseInt(year, 10);
            editData.month = parseInt(month, 10);
            editData.day = parseInt(day, 10);
          } else {
            const defaultDate = new Date();
            defaultDate.setMonth(defaultDate.getMonth() - 1);
            editData.year = defaultDate.getFullYear();
            editData.month = defaultDate.getMonth() + 1;
            editData.day = defaultDate.getDate();
          }
          
          setEditInfo(editData);
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        Alert.alert("Lỗi", "Không thể lấy thông tin người dùng. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleEditChange = (name, value) => {
    setEditInfo((prev) => {
      const newInfo = { ...prev };
      
      if (name === "year" || name === "month" || name === "day") {
        newInfo[name] = parseInt(value, 10);
        
        // Kiểm tra ngày tháng
        if (name === "year" || name === "month") {
          if (newInfo.year === currentDate.year) {
            if (newInfo.month > currentDate.month) {
              newInfo.month = currentDate.month;
            }
          }
          
          if (newInfo.year && newInfo.month && newInfo.day) {
            const daysInMonth = getDaysInMonth(newInfo.year, newInfo.month);
            if (newInfo.day > daysInMonth) {
              newInfo.day = daysInMonth;
            }
          }
        }
        
        if (name === "day") {
          if (newInfo.year === currentDate.year && newInfo.month === currentDate.month) {
            if (newInfo.day > currentDate.day) {
              newInfo.day = currentDate.day;
            }
          }
        }
      } else {
        newInfo[name] = value;
      }
      
      return newInfo;
    });
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleDateConfirm = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Kiểm tra ngày tương lai
    const selectedDate = new Date(year, month - 1, day);
    const now = new Date();
    
    if (selectedDate > now) {
      Alert.alert("Lỗi", "Không thể chọn ngày trong tương lai");
      hideDatePicker();
      return;
    }
    
    handleEditChange("year", year);
    handleEditChange("month", month);
    handleEditChange("day", day);
    
    hideDatePicker();
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh để chọn ảnh đại diện');
        return;
      }
      
      // Mở thư viện ảnh
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        const fileInfo = await getFileInfo(selectedImage.uri);
        if (fileInfo.size > 1024 * 1024) { // 1MB
          Alert.alert('Lỗi', 'Kích thước ảnh không được vượt quá 1MB');
          return;
        }
        
        setAvatarPreview(selectedImage.uri);
        setImageFile(selectedImage);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Lỗi chọn ảnh:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại sau.');
    }
  };

  const getFileInfo = async (fileUri) => {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    return { size: blob.size };
  };

  const handleAvatarUpload = async () => {
    if (!imageFile) {
      Alert.alert('Lỗi', 'Vui lòng chọn ảnh trước');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await updateUserAvatar(imageFile);
      if (result.user) {
        setUserInfo(result.user);
        Alert.alert('Thành công', 'Cập nhật ảnh đại diện thành công');
        setShowModal(false);
      }
    } catch (error) {
      console.error('Lỗi cập nhật ảnh đại diện:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật ảnh đại diện. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!editInfo.fullName || editInfo.fullName.trim() === '') {
      Alert.alert('Lỗi', 'Vui lòng nhập tên hiển thị');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let dob = '';
      if (editInfo.year && editInfo.month && editInfo.day) {
        const formattedMonth = String(editInfo.month).padStart(2, '0');
        const formattedDay = String(editInfo.day).padStart(2, '0');
        dob = `${editInfo.year}-${formattedMonth}-${formattedDay}`;
      }
      
      const updatedInfo = {
        fullName: editInfo.fullName,
        gender: editInfo.gender,
        dob: dob
      };
      
      const result = await updateUserInfo(updatedInfo);
      
      if (result.user) {
        setUserInfo(result.user);
        Alert.alert('Thành công', 'Cập nhật thông tin thành công');
      }
    } catch (error) {
      console.error('Lỗi cập nhật thông tin:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  const renderDate = () => {
    if (editInfo.year && editInfo.month && editInfo.day) {
      const formattedMonth = String(editInfo.month).padStart(2, '0');
      const formattedDay = String(editInfo.day).padStart(2, '0');
      return `${formattedDay}/${formattedMonth}/${editInfo.year}`;
    }
    return 'Chọn ngày sinh';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
            <Image 
              source={userInfo?.avatar ? { uri: userInfo.avatar } : require('../assets/icon.png')} 
              style={styles.avatar} 
            />
            <View style={styles.editAvatarIcon}>
              <Feather name="camera" size={20} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={styles.username}>{userInfo?.fullName || 'Chưa cập nhật'}</Text>
        </View>
      </View>

      {/* Form nhập thông tin */}
      <View style={styles.form}>
        <Text style={styles.label}>Tên hiển thị</Text>
        <View style={styles.inputField}>
          <Feather name="user" size={20} color="gray" />
          <TextInput 
            placeholder="Nhập tên hiển thị" 
            placeholderTextColor="gray" 
            style={styles.input} 
            value={editInfo.fullName || ''}
            onChangeText={(text) => handleEditChange('fullName', text)}
          />
        </View>

        <Text style={styles.label}>Giới tính</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity 
            style={[
              styles.genderButton, 
              editInfo.gender === 'Male' && styles.genderButtonActive
            ]}
            onPress={() => handleEditChange('gender', 'Male')}
          >
            <Text style={[
              styles.genderText, 
              editInfo.gender === 'Male' && styles.genderTextActive
            ]}>Nam</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.genderButton, 
              editInfo.gender === 'Female' && styles.genderButtonActive
            ]}
            onPress={() => handleEditChange('gender', 'Female')}
          >
            <Text style={[
              styles.genderText, 
              editInfo.gender === 'Female' && styles.genderTextActive
            ]}>Nữ</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Ngày sinh</Text>
        <TouchableOpacity style={styles.inputField} onPress={showDatePicker}>
          <Feather name="calendar" size={20} color="gray" />
          <Text style={[styles.input, !editInfo.day && styles.placeholderText]}>
            {renderDate()}
          </Text>
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleDateConfirm}
          onCancel={hideDatePicker}
          maximumDate={new Date()}
          date={
            editInfo.year && editInfo.month && editInfo.day 
              ? new Date(editInfo.year, editInfo.month - 1, editInfo.day) 
              : new Date()
          }
        />

        {/* Thông tin liên hệ - chỉ hiển thị */}
        <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
        
        <Text style={styles.label}>Số điện thoại</Text>
        <View style={styles.inputField}>
          <Feather name="phone" size={20} color="gray" />
          <Text style={styles.input}>{userInfo?.phoneNumber || 'Chưa cập nhật'}</Text>
        </View>

        <Text style={styles.label}>Email</Text>
        <View style={styles.inputField}>
          <Feather name="mail" size={20} color="gray" />
          <Text style={styles.input}>{userInfo?.email || 'Chưa cập nhật'}</Text>
        </View>

        {/* Nút lưu thay đổi */}
        <TouchableOpacity 
          style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]} 
          onPress={handleSaveChanges}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal cập nhật avatar */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cập nhật ảnh đại diện</Text>
            
            <View style={styles.modalAvatarContainer}>
              <Image 
                source={{ uri: avatarPreview }} 
                style={styles.modalAvatar} 
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setShowModal(false);
                  setAvatarPreview(null);
                  setImageFile(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton, isSubmitting && styles.buttonDisabled]} 
                onPress={handleAvatarUpload}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Cập nhật</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const getStyles = (themeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeColors.background,
  },
  header: {
    width: '100%',
    backgroundColor: themeColors.primary,
    paddingBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 60,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: themeColors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editAvatarIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 15,
  },
  form: {
    width: '90%',
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    color: 'gray',
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    color: themeColors.text,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 10,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    borderRadius: 10,
    padding: 12,
    backgroundColor: themeColors.cardBackground,
  },
  input: {
    paddingLeft: 10,
    flex: 1,
    color: themeColors.text,
    fontSize: 16,
  },
  placeholderText: {
    color: 'gray',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  genderButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  genderButtonActive: {
    backgroundColor: themeColors.primary,
  },
  genderText: {
    color: themeColors.text,
    fontSize: 16,
  },
  genderTextActive: {
    color: 'white',
  },
  saveButton: {
    backgroundColor: themeColors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  saveButtonDisabled: {
    backgroundColor: '#2D5D7B80',
  },
  saveButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: themeColors.cardBackground,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeColors.text,
    marginBottom: 20,
  },
  modalAvatarContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    marginBottom: 20,
  },
  modalAvatar: {
    width: '100%',
    height: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  confirmButton: {
    backgroundColor: '#2D5D7B',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});