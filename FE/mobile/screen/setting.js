import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Switch,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { useTheme } from "../contexts/themeContext";
import colors from "../themeColors";
import { useTranslation } from "react-i18next";
import { TextInput } from "react-native";
import changePassword from "../api/api_changePassSetting";

const App = ({ navigation }) => {
  const { theme, toggleTheme } = useTheme();
  const themeColors = colors[theme];
  const { i18n, t } = useTranslation();

  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  // State điều khiển hiển thị Modal
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const toggleSwitch = () => setIsEnabled((previousState) => !previousState);

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đồng ý", onPress: logout },
    ]);
  };

  const logout = () => {
    console.log("Đăng xuất thành công");
    navigation.navigate("started");
  };

  // Đổi ngôn ngữ và lưu vào AsyncStorage
  const changeLanguage = async (lang) => {
    await AsyncStorage.setItem("appLanguage", lang);
    i18n.changeLanguage(lang);
    setSelectedLanguage(lang);
    console.log("language ", selectedLanguage);
    console.log("lang ", lang);
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
          <TouchableOpacity
            onPress={() => setThemeModalVisible(true)}
            style={styles.pickerButton}
          >
            <Text style={styles.optionText}>
              {theme === "light" ? "Light mode" : "Dark mode"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modal chọn Theme */}
        <Modal visible={themeModalVisible} transparent animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                onPress={() => selectTheme("light")}
                style={styles.modalItem}
              >
                <Text style={styles.modalText}>Light</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => selectTheme("dark")}
                style={styles.modalItem}
              >
                <Text style={styles.modalText}>Dark</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setThemeModalVisible(false)}
                style={styles.modalCancel}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Chọn Ngôn Ngữ */}
        <View style={styles.optionContainer}>
          <Text style={styles.optionText}>{t("Ngôn ngữ")}</Text>
          <TouchableOpacity
            onPress={() => setLanguageModalVisible(true)}
            style={styles.pickerButton}
          >
            <Text style={styles.optionText}>
              {selectedLanguage === "vi" ? "Tiếng Việt" : "English"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modal chọn ngôn ngữ */}
        <Modal visible={languageModalVisible} transparent animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                onPress={() => changeLanguage("vi")}
                style={styles.modalItem}
              >
                <Text style={styles.modalText}>Tiếng Việt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => changeLanguage("en")}
                style={styles.modalItem}
              >
                <Text style={styles.modalText}>English</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setLanguageModalVisible(false)}
                style={styles.modalCancel}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
            </View>
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

        <TouchableOpacity
          style={styles.changePassButton}
          onPress={() => setPasswordModalVisible(true)}
        >
          <Text style={styles.changePassText}>Đổi mật khẩu</Text>
        </TouchableOpacity>

        {/* Modal đổi mật khẩu */}
        <Modal visible={passwordModalVisible} transparent animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text
                style={[styles.modalText, { fontSize: 20, marginBottom: 20 }]}
              >
                Đổi mật khẩu
              </Text>
              <Text style={styles.modalTextinput}>Mật khẩu hiện tại</Text>
              <TextInput
                placeholder="Mật khẩu hiện tại"
                placeholderTextColor="#999"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                style={styles.input}
              />
              <Text style={styles.modalTextinput}>Mật khẩu mới</Text>
              <TextInput
                placeholder="Mật khẩu mới"
                placeholderTextColor="#999"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                style={styles.input}
              />
              <Text style={styles.modalTextinput}>Xác nhận mật khẩu</Text>
              <TextInput
                placeholder="Xác nhận mật khẩu mới"
                placeholderTextColor="#999"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
              />

              <TouchableOpacity
                onPress={async () => {
                  if (!currentPassword || !newPassword || !confirmPassword) {
                    Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin!");
                    return;
                  }

                  if (newPassword !== confirmPassword) {
                    Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
                    return;
                  }

                  try {
                    const res = await changePassword(
                      currentPassword,
                      newPassword,
                      confirmPassword
                    );
                    Alert.alert("Thành công", "Đổi mật khẩu thành công!");
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setPasswordModalVisible(false);
                  } catch (error) {
                    Alert.alert(
                      "Lỗi",
                      error.message || "Đổi mật khẩu thất bại!"
                    );
                  }
                }}
                style={[styles.modalItem, { backgroundColor: "#4CAF50" }]}
              >
                <Text style={styles.modalText}>Lưu</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPasswordModalVisible(false)}
                style={styles.modalCancel}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Đăng xuất */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Styles
const getStyles = (themeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    optionsContainer: {
      flex: 1,
      paddingBottom: 60,
    },
    optionContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: "#D9D9D9",
    },
    optionText: {
      fontSize: 18,
      fontWeight: "bold",
      color: themeColors.text,
    },
    pickerButton: {
      backgroundColor: "#4f9ef8",
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
      width: "37%",
      alignSelf: "stretch",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 6,
    },
    // Modal
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    modalContent: {
      backgroundColor: "#fff",
      paddingVertical: 20,
      paddingHorizontal: 20,
      borderRadius: 16,
      width: 280,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 10,
    },
    modalItem: {
      width: "100%",
      paddingVertical: 14,
      backgroundColor: "#f1f1f1",
      borderRadius: 10,
      marginBottom: 10,
      alignItems: "center",
    },
    modalText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#333",
    },
    modalCancel: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      backgroundColor: "#e74c3c",
      width: 250,
      alignItems: "center",
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
      marginTop: 4,
    },
    modalCancelText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#fff",
    },
    changePassButton: {
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: "#D9D9D9",
      color: themeColors.text,
    },
    changePassText: {
      fontSize: 18,
      fontWeight: "bold",
      color: themeColors.text,
    },
    logoutButton: {
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: "#D9D9D9",
      color: themeColors.text,
    },
    logoutText: {
      fontSize: 18,
      fontWeight: "bold",
      color: themeColors.text,
    },
    input: {
      width: "100%",
      height: 50,
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 10,
      paddingHorizontal: 15,
      marginTop: 10,
      marginBottom: 12,
      fontSize: 16,
      backgroundColor: "#f9f9f9",
      color: "#333",
    },
    modalTextinput: {
      fontSize: 16,
      fontWeight: "600",
      color: "#333",
      alignSelf: "flex-start",
    },
  });
export default App;
