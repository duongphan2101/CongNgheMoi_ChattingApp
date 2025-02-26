import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../contexts/themeContext";
import colors from "../themeColors";

const TestScreen = () => {
  const { theme, toggleTheme } = useTheme();
  const themeColors = colors[theme]; // Lấy màu theo theme

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.text, { color: themeColors.text }]}>
        Chế độ hiện tại: {theme.toUpperCase()}
      </Text>

      {/* Nút đổi theme */}
      <TouchableOpacity 
        onPress={toggleTheme} 
        style={[styles.button, { backgroundColor: themeColors.button }]}
      >
        <Text style={styles.buttonText}>
          Chuyển sang chế độ {theme === "light" ? "Dark" : "Light"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 20,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default TestScreen;
