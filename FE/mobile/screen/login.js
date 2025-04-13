import { StyleSheet, Text, View, Image, TouchableOpacity, TextInput, Alert } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from "../contexts/themeContext";
import colors from "../themeColors";
import { useState } from 'react';
import login from "../api/api_login";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function App({ navigation }) {
  const { theme, toggleTheme } = useTheme();
  const themeColors = colors[theme];
  const styles = getStyles(themeColors);
  const [pass, setPass] = useState();
  const [phoneNumber, setPhoneNumber] = useState();

  const handleLogin = async () => {

    try {
      const response = await login(phoneNumber, pass);

      if (response && response.token) {
        await AsyncStorage.setItem("accessToken", response.token);
        await AsyncStorage.setItem("user", JSON.stringify(response.user));

        navigation.navigate("router");
      } else {
        Alert.alert("Sai mật khẩu hoặc tài khoản!");
        console.log("Lỗi đăng nhập:", response?.message || "Không có phản hồi từ server");
      }
    } catch (error) {
      console.error("Lỗi khi đăng nhập:", error);
      Alert.alert("Lỗi kết nối đến server. Vui lòng thử lại!");
    }
  };



  return (
    <View style={styles.container}>

      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <AntDesign name="back" size={24} color="gray" />
      </TouchableOpacity>

      <Image style={{ height: '55%', width: '100%', resizeMode: 'contains' }} source={require('../assets/slice2.png')} />
      <View style={[styles.container,
      { padding: 20, width: '100%', backgroundColor: themeColors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20 }]}>

        <View style={styles.input}>
          <Feather name="phone" size={18} color={themeColors.text} />
          <TextInput placeholder="Phone Number" placeholderTextColor={themeColors.text}
            style={{ padding: 5, marginLeft: 10, flex: 1, color: themeColors.text }}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>

        <View style={styles.input}>
          <Feather name="lock" size={18} color={themeColors.text} />
          <TextInput placeholder="Password" placeholderTextColor={themeColors.text} secureTextEntry={true}
            style={{ padding: 5, marginLeft: 10, flex: 1, color: themeColors.text }}
            value={pass}
            onChangeText={setPass}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={{ fontSize: 18, color: '#fff', fontWeight: 'bold' }}>
            Login
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
          <Text style={{ color: themeColors.text }}>
            Don't have an account?
            <TouchableOpacity onPress={() => navigation.navigate('register')}>
              <Text style={{ color: '#007AFF' }}> Sign Up</Text>
            </TouchableOpacity>
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
          <TouchableOpacity onPress={() => navigation.navigate('forgetpassword')}>
            <Text style={{ fontWeight: 'bold', color: themeColors.text }}>Forget Password?</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>

  );
}

const getStyles = (themeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
  }, back: {
    position: 'absolute',
    top: 30,
    left: 20,
    zIndex: 100,
  }, input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'grey',
    marginTop: 20,
    borderRadius: 10,
    padding: 5,
    width: '100%'
  }, button: {
    backgroundColor: themeColors.primary,
    // backgroundColor: 'black',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  }
});
