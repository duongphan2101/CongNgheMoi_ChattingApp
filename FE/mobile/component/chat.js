import { StyleSheet, Text, View, Image, TouchableOpacity, FlatList } from 'react-native';
import React, {useState} from 'react';

export default function App({navigation}) {

  const [user, setUser] = useState([
    {id: 1, name: 'Jayson', avatar: 'https://imgur.com/RLtzJy5.jpg', mess: 'Hi bro, i am Jayson'},
    {id: 2, name: 'MadDog', avatar: 'https://imgur.com/RLtzJy5.jpg', mess: 'are you ok?'},
    {id: 3, name: 'Lucia', avatar: 'https://imgur.com/RLtzJy5.jpg', mess: 'you are so handsome'},
    {id: 4, name: 'Mya', avatar: 'https://imgur.com/RLtzJy5.jpg', mess: 'i love you'},
  ]);

  return (
    <View style={styles.container}>
        <View style={styles.listChattingUsers}>
          <FlatList
          data={user}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.user} onPress={() => navigation.navigate('chatting', {user: item})}>
              <Image source={{uri: item.avatar}} style={styles.avatar}/>
              <View style={styles.userInfo}>
                <Text style={styles.text}>{item.name}</Text>
                <Text style={styles.mess}>{item.mess}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listChattingUsers: {
    flex: 1,
    width: '100%',
  },
  avatar: {
    width: 60,
    height: 60,
    marginRight: 10,
  },
  user: {
    paddingHorizontal: 10,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flexDirection: 'row',
  }, 
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  mess: {
    color: '#ccc',
  },
  userInfo: {
    justifyContent: 'center',
    flex: 1,
  }
});
