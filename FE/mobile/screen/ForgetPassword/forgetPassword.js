import { StyleSheet, Image, Text, View, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useTheme } from "../../contexts/themeContext";
import colors from "../../themeColors";
import { useState } from 'react';
import sendResetLink from "../../api/API_ForgotPassword/api_sendResetPassLink";

export default function ForgetPassword({ navigation }) {
  const { theme } = useTheme();
  const themeColors = colors[theme];
  const styles = getStyles(themeColors);
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSendResetLink = async () => {
    if (!phoneNumber) {
      Alert.alert("Vui lòng nhập số điện thoại!");
      return;
    }

    const response = await sendResetLink(phoneNumber);

    if (response) {
      Alert.alert("Link đặt lại mật khẩu đã được gửi!");
    } else {
      Alert.alert("Không thể gửi link đặt lại mật khẩu. Vui lòng thử lại!");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <AntDesign name="back" size={24} color="gray" />
          </TouchableOpacity>

          <Image style={{ height: '55%', width: '100%', resizeMode: 'contain' }} source={require('../../assets/slice2.png')} />

          <View style={styles.input}>
            <TextInput
              placeholder="Phone Number"
              placeholderTextColor={themeColors.text}
              style={{ padding: 5, marginLeft: 10, flex: 1, color: themeColors.text }}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSendResetLink}>
            <Text style={{ fontSize: 18, color: '#fff', fontWeight: 'bold' }}>Send Reset Link</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (themeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  back: {
    position: 'absolute',
    top: 30,
    left: 20,
    zIndex: 100,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'grey',
    marginTop: 20,
    borderRadius: 10,
    padding: 5,
    width: '100%',
  },
  button: {
    backgroundColor: themeColors.primary,
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
  },
});