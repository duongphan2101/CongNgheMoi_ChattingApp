import { StyleSheet, Text, View, Image, TouchableOpacity, TextInput } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';

export default function ProfileScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../assets/icon.png')} style={styles.avatar} />
        <Text style={styles.username}>This User</Text>
      </View>
      
      <View style={styles.form}>
        <View style={styles.inputField}>
          <Feather name="user" size={20} color="gray" />
          <TextInput placeholder="Tên" placeholderTextColor="gray" style={styles.input} />
        </View>
        <View style={styles.inputField}>
          <Feather name="calendar" size={20} color="gray" />
          <TextInput placeholder="Ngày sinh" placeholderTextColor="gray" style={styles.input} />
        </View>
      </View>
      
      <View style={styles.dotsContainer}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
      
      <TouchableOpacity style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <AntDesign name="home" size={24} color="#fff" />
        <AntDesign name="message1" size={24} color="#fff" />
        <AntDesign name="user" size={24} color="#fff" />
        <AntDesign name="cloud" size={24} color="#fff" />
        <AntDesign name="setting" size={24} color="#fff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    width: '100%',
    backgroundColor: '#2D5D7B',
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#fff',
    marginTop: -45,
  },
  username: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
  },
  form: {
    width: '90%',
    marginTop: 20,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'grey',
    marginTop: 20,
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#EAEAEA',
  },
  input: {
    padding: 10,
    marginLeft: 10,
    flex: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'black',
    marginHorizontal: 4,
  },
  saveButton: {
    backgroundColor: '#90EE90',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
  },
  saveButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#007AFF',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});
