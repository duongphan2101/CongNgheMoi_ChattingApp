import React, { useState } from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from "../contexts/themeContext";
import colors from "../themeColors";
import { useTranslation } from "react-i18next";

const App = () => {
  const { theme, toggleTheme } = useTheme();
  const themeColors = colors[theme];

  const { i18n, t } = useTranslation();

  const [isEnabled, setIsEnabled] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const toggleSwitch = () => setIsEnabled(previousState => !previousState);

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đồng ý", onPress: () => console.log("Đăng xuất thành công") },
    ]);
  };

  const changeLanguage = (language) => {
    setSelectedLanguage(language);
    i18n.changeLanguage(language); // Cập nhật ngôn ngữ trong i18n
  };

  // Hàm tạo style dựa trên theme
  const styles = getStyles(themeColors);

  return (
    <View style={styles.container}>
      <View style={styles.optionsContainer}>
        {/* Chế Độ (Theme Mode) */}
        <View style={styles.optionContainer}>
          <Text style={styles.optionText}>Chế Độ</Text>
          <Picker
            selectedValue={theme === "light" ? "Light mode" : "Dark mode"}
            style={styles.picker}
            onValueChange={() => toggleTheme()} 
          >
            <Picker.Item label="Light mode" value="Light mode" />
            <Picker.Item label="Dark mode" value="Dark mode" />
          </Picker>
        </View>

        {/* Ngôn Ngữ */}
        <View style={styles.optionContainer}>
          <Text style={styles.optionText}>{t("Ngôn ngữ")}</Text>
          <Picker
            selectedValue={selectedLanguage}
            style={styles.picker}
            onValueChange={(itemValue) => changeLanguage(itemValue)}
          >
            <Picker.Item label="Tiếng Việt" value="vi" />
            <Picker.Item label="English" value="en" />
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

// Hàm tạo styles dựa trên theme
const getStyles = (themeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
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
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9',
  },
  optionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeColors.text,
  },
  picker: {
    height: 30,
    width: 120,
    borderRadius: 10,
    color: themeColors.text,
    backgroundColor: themeColors.background
  },
  logoutButton: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9',
    color: themeColors.text,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeColors.text,
  },
});

export default App;
