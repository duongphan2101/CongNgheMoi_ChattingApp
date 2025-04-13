import { StyleSheet, Text, View, Image, TouchableOpacity, TextInput, Button } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from "../contexts/themeContext";
import colors from "../themeColors";
import { useState } from 'react';
import resgister from '../api/api_sendConfirmationEmail';
import Modal from "react-native-modal";

export default function App({ navigation }) {
  const { theme, toggleTheme } = useTheme();
  const themeColors = colors[theme];
  const styles = getStyles(themeColors);
  const [phoneNumber, setPhoneNumber] = useState();
  const [email, setEmail] = useState();
  const [pass, setPass] = useState();
  const [username, setUsername] = useState();
  const [isModalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState();
  
  const handleRegister = async () => {
    // console.log("Phone ", phoneNumber);
    // console.log("Email ", email);
    // console.log("UserName ", username);
    // console.log("Pass ", pass);

    const reponse = await resgister(email, phoneNumber, pass, username);
    if (reponse.success) {
      setMessage(reponse.message);
      setModalVisible(true);
    } else {
      setMessage(reponse.message);
      setModalVisible(true);
    }
  }

  return (
    <View style={styles.container}>

      <Modal isVisible={isModalVisible}>
        <View style={{ backgroundColor: themeColors.background, padding: 20, borderRadius: 10}}>
          <Text style={{color: themeColors.text, textAlign: 'center', padding: 10}}>{message}</Text>
          <Button title="Đóng" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>

      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <AntDesign name="back" size={24} color="gray" />
      </TouchableOpacity>

      <Image style={{ height: '50%', width: '100%', resizeMode: 'contains' }} source={require('../assets/slice2.png')} />
      <View style={[styles.container,
      { padding: 20, width: '100%', backgroundColor: themeColors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20 }]}>

        <View style={styles.input}>
          <Feather name="phone" size={24} color={themeColors.text} />
          <TextInput placeholder="Phone Number" placeholderTextColor={themeColors.text}
            style={{ padding: 5, marginLeft: 10, flex: 1, color: themeColors.text }}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>

        <View style={styles.input}>
          <Feather name="mail" size={24} color={themeColors.text} />
          <TextInput placeholder="Email" placeholderTextColor={themeColors.text}
            style={{ padding: 5, marginLeft: 10, flex: 1, color: themeColors.text }}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.input}>
          <Feather name="user" size={24} color={themeColors.text} />
          <TextInput placeholder="User Name" placeholderTextColor={themeColors.text}
            style={{ padding: 5, marginLeft: 10, flex: 1, color: themeColors.text }}
            value={username}
            onChangeText={setUsername}
          />
        </View>

        <View style={styles.input}>
          <Feather name="lock" size={24} color={themeColors.text} />
          <TextInput placeholder="Password" placeholderTextColor={themeColors.text} secureTextEntry={true}
            style={{ padding: 5, marginLeft: 10, flex: 1, color: themeColors.text }}
            value={pass}
            onChangeText={setPass}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegister} >
          <Text style={{ fontSize: 18, color: '#fff', fontWeight: 'bold' }}>
            Register
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
          <Text style={{ color: themeColors.text }}>
            Already have an account?
            <TouchableOpacity onPress={() => navigation.navigate('login')}>
              <Text style={{ color: '#007AFF' }}> Login</Text>
            </TouchableOpacity>
          </Text>
        </View>

      </View>
    </View>

  );
}

const getStyles = (themeColors) => StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: ,
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
  }, back: {
    position: 'absolute',
    top: 35,
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
    width: '100%',
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
