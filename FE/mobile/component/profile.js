import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, TextInput } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

export default function ProfileScreen({ navigation }) {
  const handleSaveChanges = () => {
    console.log('Changes saved');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <Image source={require('../assets/icon.png')} style={styles.avatar} />
          </View>
          <Text style={styles.username}>This User</Text>
        </View>
      </View>

      {/* Form nhập thông tin */}
      <View style={styles.form}>
        <Text style={styles.label}>Tên</Text>
        <View style={styles.inputField}>
          <Feather name="user" size={20} color="gray" />
          <TextInput placeholder="Tên" placeholderTextColor="gray" style={styles.input} />
        </View>

        <Text style={styles.label}>Ngày sinh</Text>
        <View style={styles.inputField}>
          <Feather name="calendar" size={20} color="gray" />
          <TextInput placeholder="Ngày sinh" placeholderTextColor="gray" style={styles.input} keyboardType="numeric" />
        </View>
        {/* Nút lưu thay đổi */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
          <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    backgroundColor: '#2D5D7B',
    paddingBottom: 10, // Điều chỉnh để avatar nằm dưới cùng
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Đẩy avatar xuống đáy header
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 140, // Tạo khoảng cách trên cùng cho bố cục đẹp hơn
    marginLeft: -100,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -60, // Đẩy avatar xuống thêm một chút
},
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 100,
  },
  username: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 15, // Tạo khoảng cách giữa avatar và tên
    marginBottom: 10, // Canh lề đẹp hơn
  },
  form: {
    width: '90%',
    marginTop: 80,
  },
  label: {
    fontSize: 16,
    color: 'gray',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'grey',
    marginBottom: 20,
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#EAEAEA',
  },
  input: {
    paddingLeft: 10,
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#90EE90',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'bottom', // Cố định vị trí
    bottom: -300, // Điều chỉnh để gần footer
},
  saveButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});

