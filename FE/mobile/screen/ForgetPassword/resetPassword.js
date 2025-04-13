import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { useTheme } from "../../contexts/themeContext";
import colors from "../../themeColors";
import resetPasswordAPI from "../../api/API_ForgotPassword/api_resetPassword";

export default function ResetPassword({ route, navigation }) {
  const { theme } = useTheme();
  const themeColors = colors[theme];
  const styles = getStyles(themeColors);

  const { token, phoneNumber } = route.params; // Nhận token và phoneNumber từ route
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Mật khẩu xác nhận không khớp!");
      return;
    }

    const response = await resetPasswordAPI(phoneNumber, newPassword, token);

    if (response) {
      Alert.alert("Đổi mật khẩu thành công!", "Bạn có thể đăng nhập lại.", [
        { text: "OK", onPress: () => navigation.navigate("Login") },
      ]);
    } else {
      Alert.alert("Không thể đổi mật khẩu. Vui lòng thử lại!");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          <Text style={styles.title}>Reset Password</Text>

          <View style={styles.input}>
            <TextInput
              placeholder="New Password"
              placeholderTextColor={themeColors.text}
              secureTextEntry={true}
              style={{ padding: 5, marginLeft: 10, flex: 1, color: themeColors.text }}
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>

          <View style={styles.input}>
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor={themeColors.text}
              secureTextEntry={true}
              style={{ padding: 5, marginLeft: 10, flex: 1, color: themeColors.text }}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
            <Text style={{ fontSize: 18, color: "#fff", fontWeight: "bold" }}>
              Reset Password
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (themeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: themeColors.text,
      marginBottom: 20,
    },
    input: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "grey",
      marginTop: 20,
      borderRadius: 10,
      padding: 5,
      width: "100%",
    },
    button: {
      backgroundColor: themeColors.primary,
      padding: 15,
      borderRadius: 10,
      marginTop: 20,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
  });