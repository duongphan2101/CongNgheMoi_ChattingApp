import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, TextInput } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from "../contexts/themeContext";
import colors from "../themeColors";

export default function ProfileScreen({ navigation }) {
  const handleSaveChanges = () => {
    console.log('Changes saved');
  };

  const { theme, toggleTheme } = useTheme();
  const themeColors = colors[theme];
  const styles = getStyles(themeColors);
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

const getStyles = (themeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    backgroundColor: '#2D5D7B',
    paddingBottom: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 140,
    marginLeft: -100,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: themeColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -60,
},
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 100,
  },
  username: {
    color: themeColors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 15,
    marginBottom: 10,
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
    backgroundColor: themeColors.background,
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
    position: 'bottom',
    bottom: -50,
},
  saveButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});

