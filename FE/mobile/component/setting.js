import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Switch, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const App = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedMode, setSelectedMode] = useState('Light mode');
  const [selectedLanguage, setSelectedLanguage] = useState('Tiếng Việt');

  const toggleSwitch = () => setIsEnabled(previousState => !previousState);

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đồng ý", onPress: () => console.log("Đăng xuất thành công") },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.optionsContainer}>
        {/* Chế Độ */}
        <View style={styles.optionContainer}>
          <Text style={styles.optionText}>Chế Độ</Text>
          <Picker
            selectedValue={selectedMode}
            style={styles.picker}
            onValueChange={(itemValue) => setSelectedMode(itemValue)}
          >
            <Picker.Item label="Light mode" value="Light mode" />
            <Picker.Item label="Dark mode" value="Dark mode" />
          </Picker>
        </View>

        {/* Ngôn Ngữ */}
        <View style={styles.optionContainer}>
          <Text style={styles.optionText}>Ngôn Ngữ</Text>
          <Picker
            selectedValue={selectedLanguage}
            style={styles.picker}
            onValueChange={(itemValue) => setSelectedLanguage(itemValue)}
          >
            <Picker.Item label="Tiếng Việt" value="Tiếng Việt" />
            <Picker.Item label="English" value="English" />
          </Picker>
        </View>

        {/* Tắt Thông Báo */}
        <View style={styles.optionContainer}>
          <Text style={styles.optionText}>Tắt Thông Báo</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isEnabled ? "#f5dd4b" : "#f4f3f4"}
            onValueChange={toggleSwitch}
            value={isEnabled}
          />
        </View>

        {/* Đăng xuất Button */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>        
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', 
  },
  header: {
    backgroundColor: '#0078D7', 
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#7399C3',
   
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: '#0078D7',
    padding: 10,
    borderRadius: 5,
  },
  optionsContainer: {
    flex: 1, 
    paddingBottom: 60, 
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9',
  },
  optionText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  picker: {
    height: 30,
    width: 100,
    borderWidth: 1,
    borderColor: '#D9D9D9', 
    borderRadius: 10, 
    backgroundColor: '#D9D9D9',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9',
  },
  logoutText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#0078D7',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 10, 
  },
  footerIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50, 
  },
  activeIcon: {
    marginBottom: 10, 
  },
});

export default App;