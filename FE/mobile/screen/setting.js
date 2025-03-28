import React, { useState } from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity, Alert, Modal } from 'react-native';
import { useTheme } from "../contexts/themeContext";
import colors from "../themeColors";
import { useTranslation } from "react-i18next";

const App = ({navigation}) => {
  const { theme, toggleTheme } = useTheme();
  const themeColors = colors[theme];
  const { i18n, t } = useTranslation();

  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  // State điều khiển hiển thị Modal
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const toggleSwitch = () => setIsEnabled(previousState => !previousState);

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đồng ý", onPress: logout},
    ]);
  };

  const logout= () => {
    console.log("Đăng xuất thành công") 
    navigation.navigate("started");
  }

  // Đổi ngôn ngữ và lưu vào AsyncStorage
  const changeLanguage = async (lang) => {
    await AsyncStorage.setItem("appLanguage", lang);
    i18n.changeLanguage(lang);
    setSelectedLanguage(lang);
    console.log('language ', selectedLanguage);
    console.log('lang ', lang);
    setLanguageModalVisible(false);
  };

  const selectTheme = (mode) => {
    toggleTheme(mode);
    setThemeModalVisible(false);
  };

  const styles = getStyles(themeColors);

  return (
    <View style={styles.container}>
      <View style={styles.optionsContainer}>

        {/* Chọn Theme */}
        <View style={styles.optionContainer}>
          <Text style={styles.optionText}>Chế Độ</Text>
          <TouchableOpacity onPress={() => setThemeModalVisible(true)} style={styles.pickerButton}>
            <Text style={styles.optionText}>{theme === "light" ? "Light mode" : "Dark mode"}</Text>
          </TouchableOpacity>
        </View>

        {/* Modal chọn Theme */}
        <Modal visible={themeModalVisible} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <TouchableOpacity onPress={() => selectTheme("light")} style={styles.modalItem}>
              <Text style={styles.modalText}>Light mode</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => selectTheme("dark")} style={styles.modalItem}>
              <Text style={styles.modalText}>Dark mode</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setThemeModalVisible(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* Chọn Ngôn Ngữ */}
        <View style={styles.optionContainer}>
          <Text style={styles.optionText}>{t("Ngôn ngữ")}</Text>
          <TouchableOpacity onPress={() => setLanguageModalVisible(true)} style={styles.pickerButton}>
            <Text style={styles.optionText}>{selectedLanguage === "vi" ? "Tiếng Việt" : "English"}</Text>
          </TouchableOpacity>
        </View>

        {/* Modal chọn ngôn ngữ */}
        <Modal visible={languageModalVisible} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <TouchableOpacity onPress={() => changeLanguage("vi")} style={styles.modalItem}>
              <Text style={styles.modalText}>Tiếng Việt</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => changeLanguage("en")} style={styles.modalItem}>
              <Text style={styles.modalText}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLanguageModalVisible(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </Modal>

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

        {/* Đăng xuất */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Styles
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
  pickerButton: {
    padding: 10,
    backgroundColor: themeColors.button,
    borderRadius: 5,
  },
  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalItem: {
    padding: 15,
    backgroundColor: "#fff",
    marginBottom: 10,
    width: 200,
    alignItems: "center",
    borderRadius: 10,
  },
  modalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalCancel: {
    padding: 15,
    backgroundColor: "red",
    width: 200,
    alignItems: "center",
    borderRadius: 10,
  },
  modalCancelText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
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
